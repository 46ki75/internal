#[derive(Default, Debug)]
pub struct TypingEntity {
    pub id: String,
    pub text: String,
    pub description: String,
    pub completion_count: u64,
}
