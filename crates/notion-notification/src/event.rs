use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Default)]
pub(crate) struct RawEvent {
    pub title: String,
    pub content: Option<String>,
    pub severity: Option<crate::object::Severity>,
    pub status: Option<crate::object::Status>,
    pub people: Option<Vec<String>>,
    pub url: Option<String>,
}

impl TryFrom<RawEvent> for crate::notify::Input {
    type Error = lambda_runtime::Error;
    fn try_from(value: RawEvent) -> Result<Self, Self::Error> {
        let content = value.content.map(|c| {
            vec![notionrs::object::block::Block::Paragraph {
                paragraph: notionrs::object::block::ParagraphBlock::from(c),
            }]
        });

        Ok(Self {
            title: value.title,
            content,
            severity: value.severity,
            status: value.status,
            people: value.people,
            url: value.url,
        })
    }
}

impl TryFrom<aws_lambda_events::event::sns::SnsRecord> for crate::notify::Input {
    type Error = lambda_runtime::Error;
    fn try_from(value: aws_lambda_events::event::sns::SnsRecord) -> Result<Self, Self::Error> {
        let title = format!(
            "[Alarm] {}",
            value.sns.subject.unwrap_or(value.sns.topic_arn.to_string())
        );
        let content = vec![notionrs::object::block::Block::Paragraph {
            paragraph: notionrs::object::block::ParagraphBlock::from(value.sns.message),
        }];
        let topic_arn = &value.sns.topic_arn;
        let severity = if topic_arn.contains("error") {
            crate::object::Severity::Error
        } else if topic_arn.contains("warn") {
            crate::object::Severity::Warn
        } else {
            crate::object::Severity::Info
        };
        let status = crate::object::Status::New;

        Ok(Self {
            title,
            content: Some(content),
            severity: Some(severity),
            status: Some(status),
            people: None,
            url: None,
        })
    }
}
