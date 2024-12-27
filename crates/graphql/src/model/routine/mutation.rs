#[derive(Default)]
pub struct RoutineMutation;

#[derive(async_graphql::InputObject)]
pub struct UpdateRoutineInput {
    pub id: String,
    pub is_done: bool,
}

#[async_graphql::Object]
impl RoutineMutation {
    pub async fn update_routine(
        &self,
        _ctx: &async_graphql::Context<'_>,
        input: UpdateRoutineInput,
    ) -> Result<super::Routine, async_graphql::Error> {
        let secret = std::env::var("NOTION_API_KEY")
            .map_err(|_| async_graphql::Error::from("NOTION_API_KEY not found"))?;

        let client = notionrs::client::Client::new().secret(secret);

        let UpdateRoutineInput { id, is_done } = input;

        let is_done_property = notionrs::page::properties::PageProperty::Checkbox(
            notionrs::page::properties::PageCheckboxProperty::from(is_done),
        );

        let mut properties = std::collections::HashMap::new();

        properties.insert("IsDone".to_string(), is_done_property);

        let request = client
            .update_page()
            .page_id(id.clone())
            .properties(properties);

        let response = request.send().await?;

        let properties = response.properties;

        let name = properties.get("Name").ok_or("Name not found")?.to_string();

        let day_of_week_property = properties
            .get("DayOfWeek")
            .ok_or("Day of the week (`DayOfWeek`) not found")?;

        let day_of_week_list = match day_of_week_property {
            notionrs::page::PageProperty::MultiSelect(multi_select) => multi_select
                .multi_select
                .iter()
                .map(|s| Ok(s.name.to_string()))
                .collect::<Result<Vec<String>, async_graphql::Error>>(),
            _ => {
                return Err(async_graphql::Error::from(
                    "Day of the week (`DayOfWeek`) is not a multi_select property",
                ))
            }
        }?;

        Ok(super::Routine {
            id,
            url: response.url,
            name,
            day_of_week_list,
            is_done,
        })
    }
}
