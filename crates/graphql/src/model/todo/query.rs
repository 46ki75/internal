#[derive(Default)]
pub struct ToDoQuery;

#[derive(serde::Deserialize, Debug)]
pub struct GitHubNotification {
    pub id: String,
    pub unread: bool,
    pub updated_at: Option<String>,
    pub last_read_at: Option<String>,
    pub subject: GitHubNotioncationSubject,
}

#[derive(serde::Deserialize, Debug)]
pub struct GitHubNotioncationSubject {
    pub title: String,

    #[allow(dead_code)]
    pub url: String,

    #[allow(dead_code)]
    pub latest_comment_url: String,

    #[allow(dead_code)]
    pub r#type: String,
}

#[async_graphql::Object]
impl ToDoQuery {
    pub async fn list_notion_to_do(
        &self,
        _ctx: &async_graphql::Context<'_>,
    ) -> Result<super::ToDoConnection, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let database_id = std::env::var("NOTION_TODO_DATABASE_ID")
            .map_err(|_| async_graphql::Error::from("NOTION_TODO_DATABASE_ID not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let request = client
            .query_database()
            .filter(notionrs::filter::Filter::and(vec![
                notionrs::filter::Filter::select_equals("Type", "todo"),
                notionrs::filter::Filter::checkbox_is_not_checked("IsDone"),
            ]))
            .database_id(database_id);

        let response = request.send().await?;

        let todos = response
            .results
            .iter()
            .map(|result| {
                let id = result.id.clone();

                let url = result.url.clone();

                let source = String::from("Notion:todo");

                let title = result
                    .properties
                    .get("Title")
                    .ok_or("Title not found")?
                    .to_string();

                let description = result
                    .properties
                    .get("Description")
                    .map(|description| description.to_string());

                let is_done = match result.properties.get("IsDone").ok_or("IsDone not found")? {
                    notionrs::page::PageProperty::Checkbox(is_done) => Ok(is_done.checkbox),
                    _ => Err("IsDone not found"),
                }?;

                let deadline =
                    result
                        .properties
                        .get("Deadline")
                        .and_then(|deadline| match deadline {
                            notionrs::page::PageProperty::Date(deadline) => {
                                deadline.date.clone().map(|d| d.to_string())
                            }
                            _ => None,
                        });

                let severity: super::Severity = result
                    .properties
                    .get("Severity")
                    .and_then(|s| {
                        if let notionrs::page::PageProperty::Select(select) = s {
                            if let Some(select_name) = &select.select {
                                let select_name_str = select_name.to_string();

                                if select_name_str == "INFO" {
                                    Some(super::Severity::Info)
                                } else if select_name_str == "WARN" {
                                    return Some(super::Severity::Warn);
                                } else if select_name_str == "ERROR" {
                                    return Some(super::Severity::Error);
                                } else if select_name_str == "FATAL" {
                                    return Some(super::Severity::Fatal);
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
                    .unwrap_or(super::Severity::Unknown);

                let created_at = Some(result.created_time.to_rfc3339());
                let updated_at = Some(result.last_edited_time.to_rfc3339());

                Ok(crate::model::todo::ToDo {
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
            .collect::<Result<Vec<super::ToDo>, async_graphql::Error>>()?;

        let end_cursor = response.results.last().map(|result| result.id.clone());

        let connection = crate::model::todo::ToDoConnection {
            edges: todos
                .into_iter()
                .map(|node| crate::model::todo::ToDoEdge {
                    cursor: node.id.clone(),
                    node,
                })
                .collect::<Vec<crate::model::todo::ToDoEdge>>(),
            page_info: crate::model::PageInfo {
                has_next_page: response.has_more.unwrap_or(false),
                end_cursor,
                next_cursor: response.next_cursor.clone(),
                ..Default::default()
            },
        };

        Ok(connection)
    }

    pub async fn list_github_todo(
        &self,
        _ctx: &async_graphql::Context<'_>,
    ) -> Result<super::ToDoConnection, async_graphql::Error> {
        let client = reqwest::Client::new();

        let token = std::env::var("GITHUB_TOKEN")
            .map_err(|_| async_graphql::Error::from("GITHUB_TOKEN not found"))?;

        let url = "https://api.github.com/notifications";

        let request = client
            .get(url)
            .header("Authorization", format!("Bearer {}", token))
            .header("User-Agent", "Rust - reqwest/0.12.9");

        let response = request.send().await?.text().await?;

        let notifications: Vec<GitHubNotification> = serde_json::from_str(&response)?;

        let todos = notifications
            .iter()
            .map(|notification| {
                let id = notification.id.clone();

                let url = String::from("https://github.com/notifications");

                let source = String::from("GitHub:notification");

                let title = notification.subject.title.clone();

                let description = None;

                let is_done = !notification.unread;

                let deadline = None;

                let severity = super::Severity::Unknown;

                let created_at = notification.last_read_at.clone();

                let updated_at = notification.updated_at.clone();

                crate::model::todo::ToDo {
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
                }
            })
            .collect::<Vec<crate::model::todo::ToDo>>();

        let connection = crate::model::todo::ToDoConnection {
            edges: todos
                .into_iter()
                .map(|node| crate::model::todo::ToDoEdge {
                    cursor: node.id.clone(),
                    node,
                })
                .collect::<Vec<crate::model::todo::ToDoEdge>>(),
            page_info: crate::model::PageInfo {
                ..Default::default()
            },
        };

        Ok(connection)
    }
}
