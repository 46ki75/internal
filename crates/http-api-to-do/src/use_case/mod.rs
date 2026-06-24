pub mod input;
pub mod output;

use crate::repository::{ToDoRepository, ToDoRepositoryError};
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

fn convert_page_response_to_to_do_entity(
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

    let is_recurring =
        match response
            .properties
            .get("IsRecurring")
            .ok_or(ToDoUseCaseError::PropertyNotFound(
                "IsRecurring".to_string(),
            ))? {
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

                    serde_plain::from_str::<ToDoSeverityEntity>(&select_name_str)
                        .inspect_err(|e| {
                            tracing::warn!("Unexpected variant detected in severity: {}", e)
                        })
                        .unwrap_or(ToDoSeverityEntity::Unknown)
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

impl ToDoUseCase {
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
            deadline,
            severity: severity.unwrap_or(ToDoSeverityEntity::Unknown),
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

        let to_do_entity = convert_page_response_to_to_do_entity(&page_response)?;

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
                let to_do_entity = convert_page_response_to_to_do_entity(page_response)?;
                Ok(to_do_entity)
            })
            .collect::<Result<Vec<ToDoEntity>, ToDoUseCaseError>>()?;

        Ok(todos)
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    /// Builds a minimal `PageResponse` carrying the given properties, so tests
    /// can exercise `convert_page_response_to_to_do_entity` against arbitrary
    /// property sets without hand-writing the full struct each time. Mirrors the
    /// `stub_page` helper in `trivia/repository/mod.rs`.
    fn make_page(properties: std::collections::HashMap<String, PageProperty>) -> PageResponse {
        let user = notionrs_types::object::user::User {
            object: "user".to_string(),
            id: "00000000-0000-0000-0000-000000000000".to_string(),
            ..Default::default()
        };

        let ts = time::OffsetDateTime::parse(
            "2025-02-22T13:33:00Z",
            &time::format_description::well_known::Rfc3339,
        )
        .unwrap();

        PageResponse {
            id: "test-id".to_string(),
            created_time: ts,
            last_edited_time: ts,
            created_by: user.clone(),
            last_edited_by: user,
            cover: None,
            icon: None,
            parent: notionrs_types::object::parent::Parent::PageParent(
                notionrs_types::object::parent::PageParent {
                    r#type: "page_id".to_string(),
                    page_id: "00000000-0000-0000-0000-000000000000".to_string(),
                },
            ),
            #[allow(deprecated)]
            archived: false,
            properties,
            url: "https://www.notion.so/test".to_string(),
            public_url: None,
            developer_survey: None,
            request_id: None,
            in_trash: false,
            is_locked: false,
            is_archived: false,
        }
    }

    /// All properties required by the converter, with neutral defaults. Tests
    /// override or remove individual entries to drive specific branches.
    fn base_props() -> std::collections::HashMap<String, PageProperty> {
        let mut p = std::collections::HashMap::new();
        p.insert(
            "Title".to_string(),
            PageProperty::Title(PageTitleProperty::from("My Task".to_string())),
        );
        p.insert(
            "IsDone".to_string(),
            PageProperty::Checkbox(PageCheckboxProperty::from(false)),
        );
        p.insert(
            "IsRecurring".to_string(),
            PageProperty::Checkbox(PageCheckboxProperty::from(false)),
        );
        p.insert(
            "IsArchived".to_string(),
            PageProperty::Checkbox(PageCheckboxProperty::from(false)),
        );
        p
    }

    fn checkbox(value: bool) -> PageProperty {
        PageProperty::Checkbox(PageCheckboxProperty::from(value))
    }

    fn select(name: &str) -> PageProperty {
        PageProperty::Select(PageSelectProperty::from(name.to_string()))
    }

    // ---- convert_page_response_to_to_do_entity (pure) ----

    #[test]
    fn convert_fixture_happy_path() {
        // The committed fixture: Severity null, no Description, deadline stored
        // under "Date" (not "Deadline"), so several optional fields resolve to
        // their empty form.
        let page: PageResponse = serde_json::from_slice(include_bytes!("../to_do.json")).unwrap();

        let entity = convert_page_response_to_to_do_entity(&page).unwrap();

        assert_eq!(entity.title, "家族会議");
        assert_eq!(entity.source, "Notion:todo");
        assert!(!entity.is_done);
        assert!(!entity.is_recurring);
        assert!(!entity.is_archived);
        assert_eq!(entity.severity, ToDoSeverityEntity::Unknown);
        assert_eq!(entity.description, None);
        // Fixture uses the "Date" property, which the converter does not read.
        assert_eq!(entity.deadline, None);
        assert_eq!(
            entity.created_at,
            Some(time::Date::from_calendar_date(2025, time::Month::February, 22).unwrap())
        );
    }

    #[test]
    fn missing_title_is_error() {
        let mut props = base_props();
        props.remove("Title");
        let err = convert_page_response_to_to_do_entity(&make_page(props)).unwrap_err();
        assert!(matches!(err, ToDoUseCaseError::PropertyNotFound(p) if p == "title"));
    }

    #[test]
    fn missing_is_done_is_error() {
        let mut props = base_props();
        props.remove("IsDone");
        let err = convert_page_response_to_to_do_entity(&make_page(props)).unwrap_err();
        assert!(matches!(err, ToDoUseCaseError::PropertyNotFound(p) if p == "IsDone"));
    }

    #[test]
    fn missing_is_recurring_is_error() {
        let mut props = base_props();
        props.remove("IsRecurring");
        let err = convert_page_response_to_to_do_entity(&make_page(props)).unwrap_err();
        assert!(matches!(err, ToDoUseCaseError::PropertyNotFound(p) if p == "IsRecurring"));
    }

    #[test]
    fn missing_is_archived_is_error() {
        let mut props = base_props();
        props.remove("IsArchived");
        let err = convert_page_response_to_to_do_entity(&make_page(props)).unwrap_err();
        assert!(matches!(err, ToDoUseCaseError::PropertyNotFound(p) if p == "IsArchived"));
    }

    #[test]
    fn is_done_wrong_type_is_error() {
        let mut props = base_props();
        props.insert("IsDone".to_string(), select("oops"));
        let err = convert_page_response_to_to_do_entity(&make_page(props)).unwrap_err();
        assert!(matches!(err, ToDoUseCaseError::PropertyNotFound(p) if p == "IsDone"));
    }

    #[test]
    fn is_done_true_is_read() {
        let mut props = base_props();
        props.insert("IsDone".to_string(), checkbox(true));
        let entity = convert_page_response_to_to_do_entity(&make_page(props)).unwrap();
        assert!(entity.is_done);
    }

    #[test]
    fn description_whitespace_only_is_none() {
        let mut props = base_props();
        props.insert(
            "Description".to_string(),
            PageProperty::RichText(PageRichTextProperty::from("   ".to_string())),
        );
        let entity = convert_page_response_to_to_do_entity(&make_page(props)).unwrap();
        assert_eq!(entity.description, None);
    }

    #[test]
    fn description_non_empty_is_some() {
        let mut props = base_props();
        props.insert(
            "Description".to_string(),
            PageProperty::RichText(PageRichTextProperty::from("hello".to_string())),
        );
        let entity = convert_page_response_to_to_do_entity(&make_page(props)).unwrap();
        assert_eq!(entity.description, Some("hello".to_string()));
    }

    #[test]
    fn severity_valid_variant_is_parsed() {
        let mut props = base_props();
        props.insert("Severity".to_string(), select("ERROR"));
        let entity = convert_page_response_to_to_do_entity(&make_page(props)).unwrap();
        assert_eq!(entity.severity, ToDoSeverityEntity::Error);
    }

    #[test]
    fn severity_unknown_string_falls_back() {
        let mut props = base_props();
        props.insert("Severity".to_string(), select("BOGUS"));
        let entity = convert_page_response_to_to_do_entity(&make_page(props)).unwrap();
        assert_eq!(entity.severity, ToDoSeverityEntity::Unknown);
    }

    #[test]
    fn deadline_date_is_read() {
        let date = time::Date::from_calendar_date(2025, time::Month::March, 22).unwrap();
        let mut props = base_props();
        props.insert(
            "Deadline".to_string(),
            PageProperty::Date(PageDateProperty {
                date: Some(PageDatePropertyParameter {
                    start: Some(DateOrDateTime::Date(date)),
                    ..Default::default()
                }),
                ..Default::default()
            }),
        );
        let entity = convert_page_response_to_to_do_entity(&make_page(props)).unwrap();
        assert_eq!(entity.deadline, Some(date));
    }

    #[test]
    fn deadline_datetime_keeps_date_part() {
        let dt = time::OffsetDateTime::parse(
            "2025-03-22T09:30:00Z",
            &time::format_description::well_known::Rfc3339,
        )
        .unwrap();
        let mut props = base_props();
        props.insert(
            "Deadline".to_string(),
            PageProperty::Date(PageDateProperty {
                date: Some(PageDatePropertyParameter {
                    start: Some(DateOrDateTime::DateTime(dt)),
                    ..Default::default()
                }),
                ..Default::default()
            }),
        );
        let entity = convert_page_response_to_to_do_entity(&make_page(props)).unwrap();
        assert_eq!(entity.deadline, Some(dt.date()));
    }

    // ---- async use-case methods (via stub) ----

    #[tokio::test]
    async fn create_to_do_maps_inputs() {
        let to_do_repository = std::sync::Arc::new(crate::repository::ToDoRepositoryStub);
        let to_do_use_case = ToDoUseCase { to_do_repository };

        let deadline = time::Date::from_calendar_date(2024, time::Month::April, 4).unwrap();
        let entity = to_do_use_case
            .create_to_do(
                "My Title".to_string(),
                Some("My Description".to_string()),
                None,
                Some(deadline),
            )
            .await
            .unwrap();

        assert_eq!(entity.title, "My Title");
        assert_eq!(entity.source, "Notion:todo");
        assert_eq!(entity.deadline, Some(deadline));
        assert_eq!(entity.severity, ToDoSeverityEntity::Unknown);
        assert!(!entity.is_done);
        // description is read back from the (stub) response, which carries no
        // Description property, so it resolves to None.
        assert_eq!(entity.description, None);
    }

    #[tokio::test]
    async fn update_to_do_returns_converted_entity() {
        let to_do_repository = std::sync::Arc::new(crate::repository::ToDoRepositoryStub);
        let to_do_use_case = ToDoUseCase { to_do_repository };

        let entity = to_do_use_case
            .update_to_do("aab0c9e2-d945-4ba2-a7f2-0609fee58530".to_string(), true)
            .await
            .unwrap();

        // The stub echoes the fixture, so the converted entity reflects it.
        assert_eq!(entity.title, "家族会議");
        assert_eq!(entity.source, "Notion:todo");
        assert_eq!(entity.severity, ToDoSeverityEntity::Unknown);
    }

    #[tokio::test]
    async fn list_notion_todo_returns_one() {
        let to_do_repository = std::sync::Arc::new(crate::repository::ToDoRepositoryStub);
        let to_do_use_case = ToDoUseCase { to_do_repository };

        let todos = to_do_use_case.list_notion_to_do().await.unwrap();

        assert_eq!(todos.len(), 1);
        assert_eq!(todos[0].title, "家族会議");
        assert_eq!(todos[0].source, "Notion:todo");
    }
}
