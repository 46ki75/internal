pub mod input;
pub mod output;

use crate::to_do::repository::{ToDoRepository, ToDoRepositoryError};
use notionrs_types::prelude::*;
use output::*;

#[derive(Debug, thiserror::Error)]
pub enum ToDoUseCaseError {
    #[error("property not found: {0}")]
    PropertyNotFound(String),
    #[error("repository error: {0}")]
    Repository(#[from] ToDoRepositoryError),
}

pub struct ToDoUseCase {
    pub to_do_repository: std::sync::Arc<dyn ToDoRepository + Send + Sync>,
}

impl ToDoUseCase {
    pub async fn create_to_do(
        &self,
        title: String,
        description: Option<String>,
        severity: Option<ToDoSeverityEntity>,
    ) -> Result<ToDoEntity, ToDoUseCaseError> {
        let properties = {
            let mut properties = std::collections::HashMap::new();

            properties.insert(
                "Severity".to_string(),
                PageProperty::Select(PageSelectProperty::from(
                    serde_plain::to_string(&severity.unwrap_or(ToDoSeverityEntity::Unknown))
                        .unwrap_or("UNKNOWN".to_string()),
                )),
            );

            properties.insert(
                "Title".to_string(),
                PageProperty::Title(PageTitleProperty::from(title.clone())),
            );

            if let Some(description) = description {
                properties.insert(
                    "Description".to_string(),
                    PageProperty::RichText(PageRichTextProperty::from(description.clone())),
                );
            };

            properties
        };

        let response = self.to_do_repository.create_to_do(properties).await?;

        let description = response.properties.get("Description").and_then(|d| {
            let description = d.to_string();
            if description.trim().is_empty() {
                None
            } else {
                Some(description)
            }
        });

        Ok(ToDoEntity {
            id: response.id,
            url: response.url,
            title,
            description,
            source: "Notion:todo".to_string(),
            is_done: false,
            is_recurring: false,
            deadline: None,
            severity: ToDoSeverityEntity::Info,
            created_at: Some(response.created_time.to_string()),
            updated_at: Some(response.last_edited_time.to_string()),
        })
    }

    pub async fn update_to_do(
        &self,
        id: String,
        is_done: bool,
    ) -> Result<ToDoEntity, ToDoUseCaseError> {
        let mut properties = std::collections::HashMap::new();

        properties.insert(
            "IsDone".to_string(),
            PageProperty::Checkbox(PageCheckboxProperty::from(is_done)),
        );

        let response = self.to_do_repository.update_to_do(id, properties).await?;

        let properties = response.properties;

        let title_property = properties
            .get("Title")
            .ok_or(ToDoUseCaseError::PropertyNotFound("Title".to_string()))?;

        let title = if let PageProperty::Title(title) = title_property {
            Ok(title.to_string())
        } else {
            Err(ToDoUseCaseError::PropertyNotFound("Title".to_string()))
        }?;

        let serverity_property = properties
            .get("Severity")
            .ok_or(ToDoUseCaseError::PropertyNotFound("Severity".to_string()))?;

        let severity = if let PageProperty::Select(severity) = serverity_property {
            let select_name_str = severity.to_string();
            let severity = serde_plain::from_str::<ToDoSeverityEntity>(&select_name_str)
                .inspect_err(|e| tracing::warn!("Unexpected variant detected in severity: {}", e))
                .unwrap_or(ToDoSeverityEntity::Unknown);
            Ok(severity)
        } else {
            Err(ToDoUseCaseError::PropertyNotFound("Severity".to_string()))
        }?;

        Ok(ToDoEntity {
            id: response.id,
            url: response.url,
            source: "Notion:todo".to_string(),
            title,
            description: None,
            is_done,
            is_recurring: false,
            deadline: None,
            severity,
            created_at: Some(response.created_time.to_string()),
            updated_at: Some(response.last_edited_time.to_string()),
        })
    }

    pub async fn list_notion_to_do(&self) -> Result<Vec<ToDoEntity>, ToDoUseCaseError> {
        let filter = notionrs_types::object::request::filter::Filter::and(vec![
            notionrs_types::object::request::filter::Filter::checkbox_is_not_checked("IsDone"),
        ]);

        let response = self.to_do_repository.list_notion_to_do(filter).await?;

        let todos = response
            .iter()
            .map(|result| {
                let id = result.id.clone();

                let url = result.url.clone();

                let source = String::from("Notion:todo");

                let title = result
                    .properties
                    .get("Title")
                    .ok_or(ToDoUseCaseError::PropertyNotFound("title".to_string()))?
                    .to_string();

                let description = result.properties.get("Description").and_then(|d| {
                    let description = d.to_string();
                    if description.trim().is_empty() {
                        None
                    } else {
                        Some(description)
                    }
                });

                let is_done = match result
                    .properties
                    .get("IsDone")
                    .ok_or(ToDoUseCaseError::PropertyNotFound("IsDone".to_string()))?
                {
                    PageProperty::Checkbox(is_done) => Ok(is_done.checkbox),
                    _ => Err(ToDoUseCaseError::PropertyNotFound("IsDone".to_string())),
                }?;

                let is_recurring = match result.properties.get("IsRecurring").ok_or(
                    ToDoUseCaseError::PropertyNotFound("IsRecurring".to_string()),
                )? {
                    PageProperty::Checkbox(is_done) => Ok(is_done.checkbox),
                    _ => Err(ToDoUseCaseError::PropertyNotFound(
                        "IsRecurring".to_string(),
                    )),
                }?;

                let deadline =
                    result
                        .properties
                        .get("Deadline")
                        .and_then(|deadline| match deadline {
                            PageProperty::Date(deadline) => {
                                deadline.date.clone().map(|d| d.to_string())
                            }
                            _ => None,
                        });

                let severity: ToDoSeverityEntity = result
                    .properties
                    .get("Severity")
                    .and_then(|s| {
                        if let PageProperty::Select(select) = s {
                            select.select.as_ref().map(|select_name| {
                                let select_name_str = select_name.to_string();
                                let severity =
                                    serde_plain::from_str::<ToDoSeverityEntity>(&select_name_str)
                                        .inspect_err(|e| {
                                            tracing::warn!(
                                                "Unexpected variant detected in severity: {}",
                                                e
                                            )
                                        })
                                        .unwrap_or(ToDoSeverityEntity::Unknown);
                                severity
                            })
                        } else {
                            None
                        }
                    })
                    .unwrap_or(ToDoSeverityEntity::Unknown);

                let created_at = Some(result.created_time.to_string());
                let updated_at = Some(result.last_edited_time.to_string());

                Ok(ToDoEntity {
                    id,
                    url,
                    source,
                    title,
                    description,
                    is_done,
                    is_recurring,
                    deadline,
                    severity,
                    created_at,
                    updated_at,
                })
            })
            .collect::<Result<Vec<ToDoEntity>, ToDoUseCaseError>>()?;

        Ok(todos)
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[tokio::test]
    async fn create_to_do() {
        let to_do_repository = std::sync::Arc::new(crate::to_do::repository::ToDoRepositoryStub);

        let to_do_use_case = ToDoUseCase { to_do_repository };

        let _todos = to_do_use_case
            .create_to_do(
                "My Title".to_string(),
                Some("My Description".to_string()),
                None,
            )
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn update_to_do() {
        let to_do_repository = std::sync::Arc::new(crate::to_do::repository::ToDoRepositoryStub);

        let to_do_use_case = ToDoUseCase { to_do_repository };

        let _todos = to_do_use_case
            .update_to_do("aab0c9e2-d945-4ba2-a7f2-0609fee58530".to_string(), true)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn list_notion_todo() {
        let to_do_repository = std::sync::Arc::new(crate::to_do::repository::ToDoRepositoryStub);

        let to_do_use_case = ToDoUseCase { to_do_repository };

        let _todos = to_do_use_case.list_notion_to_do().await.unwrap();
    }
}
