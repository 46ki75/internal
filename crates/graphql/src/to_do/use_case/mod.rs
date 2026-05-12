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
    fn convert_page_response_to_to_do_entity(
        &self,
        response: &PageResponse,
    ) -> Result<ToDoEntity, ToDoUseCaseError> {
        let id = response.id.clone();

        let url = response.url.clone();

        let source = String::from("Notion:todo");

        let title = response
            .properties
            .get("Title")
            .ok_or(ToDoUseCaseError::PropertyNotFound("title".to_string()))?
            .to_string();

        let description = response.properties.get("Description").and_then(|d| {
            let description = d.to_string();
            if description.trim().is_empty() {
                None
            } else {
                Some(description)
            }
        });

        let is_done = match response
            .properties
            .get("IsDone")
            .ok_or(ToDoUseCaseError::PropertyNotFound("IsDone".to_string()))?
        {
            PageProperty::Checkbox(is_done) => Ok(is_done.checkbox),
            _ => Err(ToDoUseCaseError::PropertyNotFound("IsDone".to_string())),
        }?;

        let is_recurring = match response.properties.get("IsRecurring").ok_or(
            ToDoUseCaseError::PropertyNotFound("IsRecurring".to_string()),
        )? {
            PageProperty::Checkbox(is_done) => Ok(is_done.checkbox),
            _ => Err(ToDoUseCaseError::PropertyNotFound(
                "IsRecurring".to_string(),
            )),
        }?;

        let is_archived = match response
            .properties
            .get("IsArchived")
            .ok_or(ToDoUseCaseError::PropertyNotFound("IsArchived".to_string()))?
        {
            PageProperty::Checkbox(is_done) => Ok(is_done.checkbox),
            _ => Err(ToDoUseCaseError::PropertyNotFound("IsArchived".to_string())),
        }?;

        let deadline = response
            .properties
            .get("Deadline")
            .and_then(|deadline| match deadline {
                PageProperty::Date(deadline) => deadline.date.as_ref().and_then(|d| {
                    d.start.map(|start| match start {
                        DateOrDateTime::Date(date) => date,
                        DateOrDateTime::DateTime(dt) => dt.date(),
                    })
                }),
                _ => None,
            });

        let severity: ToDoSeverityEntity = response
            .properties
            .get("Severity")
            .and_then(|s| {
                if let PageProperty::Select(select) = s {
                    select.select.as_ref().map(|select_name| {
                        let select_name_str = select_name.to_string();
                        let severity =
                            serde_plain::from_str::<ToDoSeverityEntity>(&select_name_str)
                                .inspect_err(|e| {
                                    tracing::warn!("Unexpected variant detected in severity: {}", e)
                                })
                                .unwrap_or(ToDoSeverityEntity::Unknown);
                        severity
                    })
                } else {
                    None
                }
            })
            .unwrap_or(ToDoSeverityEntity::Unknown);

        Ok(ToDoEntity {
            id,
            url,
            source,
            title,
            description,
            is_done,
            is_recurring,
            is_archived,
            deadline,
            severity,
            created_at: Some(response.created_time.date()),
            updated_at: Some(response.last_edited_time.date()),
        })
    }

    pub async fn create_to_do(
        &self,
        title: String,
        description: Option<String>,
        severity: Option<ToDoSeverityEntity>,
        deadline: Option<time::Date>,
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

            if let Some(deadline) = deadline {
                properties.insert(
                    "Deadline".to_string(),
                    PageProperty::Date(PageDateProperty {
                        date: Some(PageDatePropertyParameter {
                            start: Some(DateOrDateTime::Date(deadline)),
                            ..Default::default()
                        }),
                        ..Default::default()
                    }),
                );
            }

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
            is_archived: false,
            deadline: None,
            severity: ToDoSeverityEntity::Info,
            created_at: Some(response.created_time.date()),
            updated_at: Some(response.last_edited_time.date()),
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

        let page_response = self.to_do_repository.update_to_do(id, properties).await?;

        let to_do_entity = self.convert_page_response_to_to_do_entity(&page_response)?;

        Ok(to_do_entity)
    }

    pub async fn list_notion_to_do(&self) -> Result<Vec<ToDoEntity>, ToDoUseCaseError> {
        let filter = notionrs_types::object::request::filter::Filter::and(vec![
            notionrs_types::object::request::filter::Filter::checkbox_is_not_checked("IsArchived"),
        ]);

        let response = self.to_do_repository.list_notion_to_do(filter).await?;

        let todos = response
            .iter()
            .map(|page_response| {
                let to_do_entity = self.convert_page_response_to_to_do_entity(page_response)?;
                Ok(to_do_entity)
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
                Some(time::Date::from_calendar_date(2024, time::Month::April, 4).unwrap()),
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
