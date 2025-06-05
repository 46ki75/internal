pub struct AnkiQueryResolver;

#[derive(async_graphql::InputObject)]
pub struct AnkiInput {
    pub page_id: String,
}

#[derive(async_graphql::InputObject)]
pub struct AnkiListInput {
    page_size: Option<u32>,
    next_cursor: Option<String>,
}

#[async_graphql::Object]
impl AnkiQueryResolver {
    pub async fn anki(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: AnkiInput,
    ) -> Result<super::Anki, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let anki_entity = anki_service
            .get_anki_by_id(&input.page_id)
            .await
            .map_err(|e| async_graphql::Error::new(e.to_string()))?;

        let anki = super::Anki::from(anki_entity);

        Ok(anki)
    }

    pub async fn anki_list(
        &self,
        ctx: &async_graphql::Context<'_>,
        input: Option<AnkiListInput>,
    ) -> Result<super::AnkiConnection, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let input = input.unwrap_or(AnkiListInput {
            page_size: None,
            next_cursor: None,
        });

        let (anki_entity_list, next_cursor) = anki_service
            .list_anki(input.page_size.unwrap_or(50), input.next_cursor)
            .await
            .map_err(|e| e.to_string())?;

        let anki_edges = anki_entity_list
            .into_iter()
            .map(|anki| super::AnkiEdge {
                cursor: anki.page_id.clone(),
                node: super::Anki::from(anki),
            })
            .collect::<Vec<super::AnkiEdge>>();

        let anki_connection = super::AnkiConnection {
            edges: anki_edges,
            page_info: crate::resolver::PageInfo {
                has_next_page: next_cursor.is_some(),
                next_cursor: next_cursor,
                ..Default::default()
            },
        };

        Ok(anki_connection)
    }
}

#[async_graphql::ComplexObject]
impl super::Anki {
    pub async fn block_list(
        &self,
        ctx: &async_graphql::Context<'_>,
    ) -> Result<super::AnkiBlock, async_graphql::Error> {
        let anki_service = ctx.data::<std::sync::Arc<crate::service::anki::AnkiService>>()?;

        let result = anki_service
            .list_blocks(&self.page_id)
            .await
            .map_err(|e| e.to_string())?;

        let blocks = super::AnkiBlock::from(result);

        Ok(blocks)
    }
}
