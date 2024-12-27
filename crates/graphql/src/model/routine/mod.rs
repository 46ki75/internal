pub mod query;

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct Routine {
    pub id: String,
    pub url: String,
    pub name: String,
    pub day_of_week: Vec<MultiSelect>,
    pub is_done: bool,
}

#[derive(async_graphql::SimpleObject, Default, Debug)]
pub struct MultiSelect {
    pub id: String,
    pub name: String,
    pub color: String,
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
