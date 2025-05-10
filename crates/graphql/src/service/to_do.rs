use notionrs_types::prelude::*;

pub struct ToDoService {
    pub to_do_repository:
        std::sync::Arc<dyn crate::repository::to_do::ToDoRepository + Send + Sync>,
}

impl ToDoService {
    pub async fn create_to_do(
        &self,
        title: String,
    ) -> Result<crate::entity::to_do::ToDo, crate::error::Error> {
        let properties = {
            let mut properties = std::collections::HashMap::new();

            properties.insert(
                "Type".to_string(),
                PageProperty::Select(PageSelectProperty::from("todo")),
            );

            properties.insert(
                "Severity".to_string(),
                PageProperty::Select(PageSelectProperty::from("INFO")),
            );

            properties.insert(
                "Title".to_string(),
                PageProperty::Title(PageTitleProperty::from(title.clone())),
            );

            properties
        };

        let response = self.to_do_repository.create_to_do(properties).await?;

        Ok(crate::entity::to_do::ToDo {
            id: response.id,
            url: response.url,
            title,
            description: None,
            source: "Notion:todo".to_string(),
            is_done: false,
            deadline: None,
            severity: crate::entity::to_do::Severity::Info,
            created_at: Some(response.created_time.to_string()),
            updated_at: Some(response.last_edited_time.to_string()),
        })
    }

    pub async fn update_to_do(
        &self,
        id: String,
        is_done: bool,
    ) -> Result<crate::entity::to_do::ToDo, crate::error::Error> {
        let mut properties = std::collections::HashMap::new();

        properties.insert(
            "IsDone".to_string(),
            PageProperty::Checkbox(PageCheckboxProperty::from(is_done)),
        );

        let response = self.to_do_repository.update_to_do(id, properties).await?;

        let properties = response.properties;

        let title_property =
            properties
                .get("Title")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "Title".to_string(),
                ))?;

        let title = if let PageProperty::Title(title) = title_property {
            Ok(title.to_string())
        } else {
            Err(crate::error::Error::NotionPropertynotFound(
                "Title".to_string(),
            ))
        }?;

        let serverity_property =
            properties
                .get("Severity")
                .ok_or(crate::error::Error::NotionPropertynotFound(
                    "Severity".to_string(),
                ))?;

        let severity = if let PageProperty::Select(severity) = serverity_property {
            let select_name_str = severity.to_string();
            Ok(if select_name_str == "INFO" {
                crate::entity::to_do::Severity::Info
            } else if select_name_str == "WARN" {
                crate::entity::to_do::Severity::Warn
            } else if select_name_str == "ERROR" {
                crate::entity::to_do::Severity::Error
            } else {
                crate::entity::to_do::Severity::Unknown
            })
        } else {
            Err(crate::error::Error::NotionPropertynotFound(
                "Severity".to_string(),
            ))
        }?;

        Ok(crate::entity::to_do::ToDo {
            id: response.id,
            url: response.url,
            source: "Notion:todo".to_string(),
            title,
            description: None,
            is_done,
            deadline: None,
            severity,
            created_at: Some(response.created_time.to_string()),
            updated_at: Some(response.last_edited_time.to_string()),
        })
    }

    pub async fn list_notion_to_do(
        &self,
    ) -> Result<Vec<crate::entity::to_do::ToDo>, crate::error::Error> {
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
                    .ok_or(crate::error::Error::NotionPropertynotFound(
                        "title".to_string(),
                    ))?
                    .to_string();

                let description = result.properties.get("Description").and_then(|d| {
                    let description = d.to_string();
                    if description.trim().is_empty() {
                        None
                    } else {
                        Some(description)
                    }
                });

                let is_done = match result.properties.get("IsDone").ok_or(
                    crate::error::Error::NotionPropertynotFound("IsDone".to_string()),
                )? {
                    PageProperty::Checkbox(is_done) => Ok(is_done.checkbox),
                    _ => Err(crate::error::Error::NotionPropertynotFound(
                        "IsDone".to_string(),
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

                let severity: crate::entity::to_do::Severity = result
                    .properties
                    .get("Severity")
                    .and_then(|s| {
                        if let PageProperty::Select(select) = s {
                            if let Some(select_name) = &select.select {
                                let select_name_str = select_name.to_string();

                                if select_name_str == "INFO" {
                                    Some(crate::entity::to_do::Severity::Info)
                                } else if select_name_str == "WARN" {
                                    return Some(crate::entity::to_do::Severity::Warn);
                                } else if select_name_str == "ERROR" {
                                    return Some(crate::entity::to_do::Severity::Error);
                                } else {
                                    None
                                }
                            } else {
                                None
                            }
                        } else {
                            None
                        }
                    })
                    .unwrap_or(crate::entity::to_do::Severity::Unknown);

                let created_at = Some(result.created_time.to_string());
                let updated_at = Some(result.last_edited_time.to_string());

                Ok(crate::entity::to_do::ToDo {
                    id,
                    url,
                    source,
                    title,
                    description,
                    is_done,
                    deadline,
                    severity,
                    created_at,
                    updated_at,
                })
            })
            .collect::<Result<Vec<crate::entity::to_do::ToDo>, crate::error::Error>>()?;

        Ok(todos)
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[tokio::test]
    async fn create_to_do() {
        let to_do_repository = std::sync::Arc::new(crate::repository::to_do::ToDoRepositoryStub);

        let to_do_service = ToDoService { to_do_repository };

        let _todos = to_do_service
            .create_to_do("My Title".to_string())
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn update_to_do() {
        let to_do_repository = std::sync::Arc::new(crate::repository::to_do::ToDoRepositoryStub);

        let to_do_service = ToDoService { to_do_repository };

        let _todos = to_do_service
            .update_to_do("aab0c9e2-d945-4ba2-a7f2-0609fee58530".to_string(), true)
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn list_notion_todo() {
        let to_do_repository = std::sync::Arc::new(crate::repository::to_do::ToDoRepositoryStub);

        let to_do_service = ToDoService { to_do_repository };

        let _todos = to_do_service.list_notion_to_do().await.unwrap();
    }
}
