use serde::Deserialize;
use serde_json::{Value, json};

use super::{AssessmentGenerator, GenerationResult, GeneratorError};
use crate::use_case::domain::{GeneratedAssessment, ReasoningEffort};

const ENDPOINT: &str = "https://openrouter.ai/api/v1/chat/completions";
const TOOL_NAME: &str = "submit_writing_assessment";

pub struct OpenRouterAssessmentGenerator;

#[async_trait::async_trait]
impl AssessmentGenerator for OpenRouterAssessmentGenerator {
    async fn generate(
        &self,
        text: &str,
        japanese_context: Option<&str>,
    ) -> Result<GenerationResult, GeneratorError> {
        let stage = http_api_core::cache::get_or_init_stage_name()
            .await
            .map_err(|error| GeneratorError::Configuration(error.to_string()))?;
        let api_key_parameter = format!("/{stage}/46ki75/internal/openrouter/secret");
        let api_key = get_configuration_parameter(api_key_parameter).await?;
        let model_parameter = format!("/{stage}/46ki75/internal/openrouter/model");
        let model = get_configuration_parameter(model_parameter).await?;
        let reasoning_effort_parameter =
            format!("/{stage}/46ki75/internal/openrouter/reasoning-effort");
        let reasoning_effort = get_configuration_parameter(reasoning_effort_parameter)
            .await?
            .parse::<ReasoningEffort>()
            .map_err(GeneratorError::Configuration)?;
        let client = http_api_core::cache::get_or_init_reqwest_client()
            .await
            .map_err(|error| GeneratorError::Configuration(error.to_string()))?;

        let user_message = match japanese_context {
            Some(context) => format!("Japanese context:\n{context}\n\nEnglish text:\n{text}"),
            None => format!("English text:\n{text}"),
        };
        let response = client
            .post(ENDPOINT)
            .bearer_auth(api_key)
            .header(reqwest::header::CONTENT_TYPE, "application/json")
            .header("HTTP-Referer", "https://internal.46ki75.com")
            .header("X-OpenRouter-Title", "46ki75 Internal")
            .json(&json!({
                "model": model,
                "messages": [
                    {"role": "system", "content": include_str!("../../prompt.md")},
                    {"role": "user", "content": user_message}
                ],
                "tools": [{
                    "type": "function",
                    "function": {
                        "name": TOOL_NAME,
                        "description": "Submit the structured English writing assessment.",
                        "strict": true,
                        "parameters": assessment_schema()
                    }
                }],
                "tool_choice": {"type": "function", "function": {"name": TOOL_NAME}},
                "reasoning": {"effort": reasoning_effort}
            }))
            .send()
            .await
            .map_err(|error| GeneratorError::Upstream(error.to_string()))?
            .error_for_status()
            .map_err(|error| GeneratorError::Upstream(error.to_string()))?;
        let body: Value = response
            .json()
            .await
            .map_err(|error| GeneratorError::InvalidResponse(error.to_string()))?;

        let (assessment, model) = parse_response(&body)?;
        Ok(GenerationResult {
            assessment,
            model,
            reasoning_effort,
        })
    }
}

async fn get_configuration_parameter(name: String) -> Result<String, GeneratorError> {
    http_api_core::cache::get_parameter(name.clone())
        .await
        .map_err(|error| {
            GeneratorError::Configuration(format!("failed to read SSM parameter {name}: {error:?}"))
        })
}

fn assessment_schema() -> Value {
    json!({
        "type": "object",
        "additionalProperties": false,
        "required": ["score", "justification", "feedback", "revised_text", "register"],
        "properties": {
            "score": {"type": "integer", "minimum": 1, "maximum": 5},
            "justification": {"type": "string"},
            "feedback": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["type", "layer", "severity", "pattern", "original", "revised", "reason"],
                    "properties": {
                        "type": {"type": "string", "enum": ["error", "intent_check", "observation"]},
                        "layer": {"type": ["string", "null"], "enum": ["idiom", "style", null]},
                        "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                        "pattern": {"type": ["string", "null"]},
                        "original": {"type": "string"},
                        "revised": {"type": "string"},
                        "reason": {"type": "string"}
                    }
                }
            },
            "revised_text": {"type": ["string", "null"]},
            "register": {"type": "string"}
        }
    })
}

#[derive(Deserialize)]
struct ToolCall {
    #[serde(rename = "type")]
    call_type: String,
    function: FunctionCall,
}

#[derive(Deserialize)]
struct FunctionCall {
    name: String,
    arguments: String,
}

fn parse_response(body: &Value) -> Result<(GeneratedAssessment, String), GeneratorError> {
    let model = body
        .get("model")
        .and_then(Value::as_str)
        .ok_or_else(|| GeneratorError::InvalidResponse("missing response model".into()))?
        .to_owned();
    let choices = body
        .get("choices")
        .and_then(Value::as_array)
        .ok_or_else(|| GeneratorError::InvalidResponse("missing choices".into()))?;
    if choices.len() != 1 {
        return Err(GeneratorError::InvalidResponse(
            "expected exactly one choice".into(),
        ));
    }
    let calls = choices[0]
        .pointer("/message/tool_calls")
        .and_then(Value::as_array)
        .ok_or_else(|| GeneratorError::InvalidResponse("missing tool call".into()))?;
    if calls.len() != 1 {
        return Err(GeneratorError::InvalidResponse(
            "expected exactly one tool call".into(),
        ));
    }
    let call: ToolCall = serde_json::from_value(calls[0].clone())
        .map_err(|error| GeneratorError::InvalidResponse(error.to_string()))?;
    if call.call_type != "function" || call.function.name != TOOL_NAME {
        return Err(GeneratorError::InvalidResponse(format!(
            "expected {TOOL_NAME} function tool call"
        )));
    }
    let generated = serde_json::from_str(&call.function.arguments)
        .map_err(|error| GeneratorError::InvalidResponse(error.to_string()))?;
    Ok((generated, model))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn arguments() -> String {
        json!({
            "score": 5,
            "justification": "Natural and clear.",
            "feedback": [],
            "revised_text": null,
            "register": "neutral"
        })
        .to_string()
    }

    fn response(calls: Value) -> Value {
        json!({"model": "model-id", "choices": [{"message": {"tool_calls": calls}}]})
    }

    fn call(name: &str, arguments: String) -> Value {
        json!({"type": "function", "function": {"name": name, "arguments": arguments}})
    }

    #[test]
    fn parses_valid_response() {
        let (value, model) =
            parse_response(&response(json!([call(TOOL_NAME, arguments())]))).unwrap();
        assert_eq!(value.score, 5);
        assert_eq!(model, "model-id");
    }

    #[test]
    fn rejects_missing_wrong_and_multiple_calls() {
        assert!(parse_response(&response(json!([]))).is_err());
        assert!(parse_response(&response(json!([call("other", arguments())]))).is_err());
        assert!(
            parse_response(&response(json!([
                call(TOOL_NAME, arguments()),
                call(TOOL_NAME, arguments())
            ])))
            .is_err()
        );
    }

    #[test]
    fn rejects_invalid_arguments() {
        assert!(parse_response(&response(json!([call(TOOL_NAME, "not json".into())]))).is_err());
    }
}
