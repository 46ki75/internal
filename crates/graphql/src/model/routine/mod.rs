pub mod query;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct Routine {
    pub id: String,
    pub url: String,
    pub name: String,
    pub day_of_week_list: Vec<String>,
    pub is_done: bool,
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct RoutineConnection {
    pub edges: Vec<RoutineEdge>,
    pub page_info: crate::model::PageInfo,
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct RoutineEdge {
    pub node: Routine,
    pub cursor: String,
}
