use lambda_http::{run, service_fn, tracing, Error};
use std::io::Write;

#[tokio::main]
async fn main() -> Result<(), Error> {
    env_logger::Builder::from_default_env()
        .format(|buf, record| {
            let timestamp = buf.timestamp();
            let level_style = buf.default_level_style(record.level());
            let reset_style = env_logger::fmt::style::Reset;
            let bright_black_style = env_logger::fmt::style::Style::new().fg_color(Some(
                env_logger::fmt::style::Color::Ansi(env_logger::fmt::style::AnsiColor::BrightBlack),
            ));

            let level = record.level();
            let module_path = record.module_path().unwrap_or("unknown");
            let file_path = record.file().unwrap_or("unknown");
            let line = record.line().unwrap_or(0);
            let args= record.args();

            writeln!(
                buf,
                "{bright_black_style}[{timestamp} {level_style}{level}{bright_black_style} {module_path}] ({file_path}:{line}){reset_style} {args}",
                
            )
        })
        .init();

    tracing::init_default_subscriber();
    run(service_fn(internal_graphql::function_handler)).await
}
