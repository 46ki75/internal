use lambda_runtime::{Error, LambdaEvent};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
pub enum IncomingMessage {
    Raw(crate::event::RawEvent),
    Sns(aws_lambda_events::event::sns::SnsEvent),
}

#[derive(Serialize, Deserialize)]
pub(crate) struct OutgoingMessage {
    req_id: String,
}

pub(crate) async fn function_handler(
    event: LambdaEvent<IncomingMessage>,
) -> Result<OutgoingMessage, Error> {
    let _ = match event.payload {
        IncomingMessage::Raw(payload) => {
            let input = crate::notify::Input::try_from(payload)?;

            let _ = crate::notify::notify(input).await?;
        }
        IncomingMessage::Sns(payload) => {
            for record in payload.records {
                let input = crate::notify::Input::try_from(record)?;

                let _ = crate::notify::notify(input).await?;
            }
        }
    };

    Ok(OutgoingMessage {
        req_id: event.context.request_id,
    })
}
