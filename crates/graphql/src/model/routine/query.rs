#[derive(Default)]
pub struct RoutineQuery;

#[async_graphql::Object]
impl RoutineQuery {
    pub async fn list_routine(
        &self,
        _ctx: &async_graphql::Context<'_>,
    ) -> Result<super::RoutineConnection, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        // TODO: Refactor this to use the database_id from the environment
        let database_id = String::from("16934608d5c98026ac01d6116028f07f");

        // let database_id = std::env::var("NOTION_ROUTINE_DATABASE_ID")
        //     .map_err(|_| async_graphql::Error::from("NOTION_ROUTINE_DATABASE_ID not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let request = client.query_database().database_id(database_id);

        let response = request.send().await?;

        let routine_list = response
            .results
            .iter()
            .map(|result| {
                let id = result.id.clone();

                let url = result.url.clone();

                let properties = &result.properties;

                let name = properties.get("Name").ok_or("Name not found")?.to_string();

                let day_of_week_property = properties
                    .get("DayOfWeek")
                    .ok_or("Day of the week (`DayOfWeek`) not found")?;

                let day_of_week = match day_of_week_property {
                    notionrs::page::PageProperty::MultiSelect(multi_select) => multi_select
                        .multi_select
                        .iter()
                        .map(|s| {
                            Ok(super::MultiSelect {
                                id: s.id.clone().ok_or("ID not found")?,
                                name: s.name.clone(),
                                color: s.color.ok_or("Color not found")?.to_string(),
                            })
                        })
                        .collect::<Result<Vec<super::MultiSelect>, async_graphql::Error>>(),
                    _ => {
                        return Err(async_graphql::Error::from(
                            "Day of the week (`DayOfWeek`) is not a multi_select property",
                        ))
                    }
                }?;

                let is_done_property = properties.get("IsDone").ok_or("IsDone not found")?;

                let is_done = match is_done_property {
                    notionrs::page::PageProperty::Checkbox(checkbox) => checkbox.checkbox,
                    _ => {
                        return Err(async_graphql::Error::from(
                            "IsDone (`IsDone`) is not a checkbox property",
                        ))
                    }
                };

                Ok(super::Routine {
                    id,
                    url,
                    name,
                    day_of_week,
                    is_done,
                })
            })
            .collect::<Result<Vec<super::Routine>, async_graphql::Error>>()?;

        Ok(super::RoutineConnection {
            edges: routine_list
                .into_iter()
                .map(|routine| super::RoutineEdge {
                    cursor: routine.id.clone(),
                    node: routine,
                })
                .collect(),

            page_info: crate::model::PageInfo {
                has_next_page: false,
                ..Default::default()
            },
        })
    }
}
