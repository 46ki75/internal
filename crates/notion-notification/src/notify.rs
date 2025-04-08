pub struct Input {
    pub title: String,
    pub content: Option<Vec<notionrs::object::block::Block>>,
    pub severity: Option<crate::object::Severity>,
    pub status: Option<crate::object::Status>,
    pub people: Option<Vec<String>>,
    pub url: Option<String>,
}

pub async fn notify(input: Input) -> Result<(), lambda_runtime::Error> {
    let title = input.title;
    let content = input.content;
    let severity = input.severity.unwrap_or_default();
    let status = input.status.unwrap_or_default();
    let people = input.people;
    let url = input.url;

    let stage_name = std::env::var("STAGE_NAME")?;

    let aws_sdk_config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

    let ssm_client = std::sync::Arc::new(aws_sdk_ssm::Client::new(&aws_sdk_config));

    let notion_api_key = ssm_client
        .get_parameter()
        .name(format!("/{stage_name}/46ki75/internal/notion/secret"))
        .with_decryption(true)
        .send()
        .await?
        .parameter
        .and_then(|p| p.value)
        .ok_or("Failed to fetch the Notion secret.")?;

    let database_id = ssm_client
        .get_parameter()
        .name(format!(
            "/shared/46ki75/internal/notion/notification/database/id"
        ))
        .send()
        .await?
        .parameter
        .and_then(|p| p.value)
        .ok_or("Failed to fetch the Notification database ID.")?;

    let notion_client = notionrs::client::Client::new().secret(notion_api_key);

    let mut properties = std::collections::HashMap::new();

    properties.insert(
        "Title".to_string(),
        notionrs::object::page::PageProperty::Title(
            notionrs::object::page::PageTitleProperty::from(title),
        ),
    );

    properties.insert(
        "Severity".to_string(),
        notionrs::object::page::PageProperty::Select(
            notionrs::object::page::PageSelectProperty::from(serde_plain::to_string(&severity)?),
        ),
    );

    properties.insert(
        "Status".to_string(),
        notionrs::object::page::PageProperty::Status(notionrs::object::page::PageStatusProperty {
            id: None,
            status: notionrs::object::select::Select::from(serde_plain::to_string(&status)?),
        }),
    );

    let users = match people {
        Some(people) => people
            .iter()
            .map(|id| notionrs::object::user::User {
                id: id.to_owned(),
                ..Default::default()
            })
            .collect::<Vec<notionrs::object::user::User>>(),
        None => {
            let user_id = ssm_client
                .get_parameter()
                .name(format!("/shared/46ki75/internal/notion/workspace/user/id"))
                .send()
                .await?
                .parameter
                .and_then(|p| p.value)
                .ok_or("Failed to fetch the user ID.")?;

            vec![notionrs::object::user::User {
                object: "user".to_string(),
                id: user_id,
                ..Default::default()
            }]
        }
    };

    properties.insert(
        "People".to_string(),
        notionrs::object::page::PageProperty::People(notionrs::object::page::PagePeopleProperty {
            id: None,
            people: users,
        }),
    );

    if let Some(url) = url {
        properties.insert(
            "URL".to_string(),
            notionrs::object::page::PageProperty::Url(
                notionrs::object::page::PageUrlProperty::from(url),
            ),
        );
    }

    let request = match content {
        Some(content) => notion_client
            .create_page()
            .database_id(database_id)
            .properties(properties)
            .children(content),
        None => notion_client
            .create_page()
            .database_id(database_id)
            .properties(properties),
    };

    let _response = request.send().await?;

    Ok(())
}
