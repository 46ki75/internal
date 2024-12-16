#[derive(Default)]
pub struct ToDoQuery;

#[async_graphql::Object]
impl ToDoQuery {
    pub async fn list_to_do(
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

                let severity = super::Sevelity::Unknown;

                let created_at = result.created_time.to_rfc3339();
                let updated_at = result.last_edited_time.to_rfc3339();

                Ok(crate::model::todo::ToDo {
                    id,
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
}
