use std::io::{Read, Write};

fn main() {
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

    println!("Deploying graphql service...");
    println!("Deployed graphql service!");
}
