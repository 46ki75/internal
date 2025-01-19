use std::io::{Read, Write};

#[tokio::main]
async fn main() {
    let environment = std::env::var("ENVIRONMENT").expect("ENVIRONMENT must be set");

    let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");

    println!(
        "Temporary directory created at: {}",
        temp_dir.path().display()
    );

    let zip_path = temp_dir.path().join("bootstrap.zip");

    println!("Creating zip file at: {}", zip_path.display());

    let zip_file = std::fs::File::create(&zip_path).expect("Failed to create zip file");

    let mut zip_writer = zip::ZipWriter::new(zip_file);

    let options = zip::write::FileOptions::<'static, ()>::default();

    zip_writer
        .start_file("bootstrap", options)
        .expect("Failed to create file in zip");

    let mut bootstrap_content = std::fs::File::open("../../target/lambda/graphql/bootstrap")
        .expect("Failed to open bootstrap file");

    let mut buffer = Vec::new();

    bootstrap_content
        .read_to_end(&mut buffer)
        .expect("Failed to read input file");

    zip_writer
        .write_all(&buffer)
        .expect("Failed to write to zip file");

    zip_writer
        .finish()
        .expect("Failed to finish writing to zip file");

    println!("ZIP file created at: {}", zip_path.display());

    let zip_bytes = std::fs::read(&zip_path).expect("Failed to read zip file");

    let zip_blob = aws_sdk_lambda::primitives::Blob::new(zip_bytes);

    let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

    let client = aws_sdk_lambda::Client::new(&config);

    let request = client
        .update_function_code()
        .function_name(format!(
            "{environment}-46ki75-internal-lambda-function-graphql"
        ))
        .publish(true)
        .zip_file(zip_blob);

    println!("Deploying graphql service...");

    let response = request
        .send()
        .await
        .expect("Failed to update function code");

    println!("Function ARN: {}", response.function_arn.unwrap());

    println!("Deployed graphql service!");
}
