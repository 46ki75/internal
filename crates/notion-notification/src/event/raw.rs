use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Default)]
pub(crate) struct RawEvent {
    pub title: String,
    pub content: Option<String>,
    pub severity: Option<crate::object::Severity>,
    pub status: Option<crate::object::Status>,
    pub people: Option<Vec<String>>,
    pub url: Option<String>,
}

impl TryFrom<RawEvent> for crate::notify::Input {
    type Error = lambda_runtime::Error;
    fn try_from(value: RawEvent) -> Result<Self, Self::Error> {
        let content = value.content.map(|c| {
            vec![notionrs::object::block::Block::Paragraph {
                paragraph: notionrs::object::block::ParagraphBlock::from(c),
            }]
        });

        Ok(Self {
            title: value.title,
            content,
            severity: value.severity,
            status: value.status,
            people: value.people,
            url: value.url,
        })
    }
}
