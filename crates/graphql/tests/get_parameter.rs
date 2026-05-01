use internal_graphql::cache::get_parameter;

#[tokio::test]
async fn test_get_parameter() {
    let parameter_name = "/dev/46ki75/internal/notion/anki/data_source/id".to_owned();

    let start = std::time::Instant::now();
    let parameter_value = get_parameter(parameter_name.clone()).await.unwrap();
    let duration = start.elapsed();
    println!(
        "First fetch - Duration: {:?}, Value: {}",
        duration, parameter_value
    );
    assert!(!parameter_value.is_empty());

    let start = std::time::Instant::now();
    let parameter_value_cached = get_parameter(parameter_name.clone()).await.unwrap();
    let duration_cached = start.elapsed();
    println!(
        "Second fetch (cached) - Duration: {:?}, Value: {}",
        duration_cached, parameter_value_cached
    );
    assert!(!parameter_value.is_empty());
}
