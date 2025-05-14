use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use sqlx::FromRow;
use std::sync::OnceLock;

static DB_POOL: OnceLock<PgPool> = OnceLock::new();

#[derive(Debug, Serialize, Deserialize)]
pub struct DbConfig {
    pub connection_string: String,
}

/// Initialize the database connection pool
pub async fn init_db(config: DbConfig) -> Result<()> {
    // If pool is already initialized, return Ok
    if DB_POOL.get().is_some() {
        return Ok(());
    }

    let pool = PgPool::connect(&config.connection_string).await?;

    // Test the connection
    sqlx::query("SELECT 1").execute(&pool).await?;

    // Store the pool in our static
    DB_POOL.set(pool).expect("Failed to set DB_POOL");

    Ok(())
}

/// Get a reference to the database pool
pub fn get_pool() -> Option<&'static PgPool> {
    DB_POOL.get()
}

/// Test a database connection without storing it
pub async fn test_connection(connection_string: &str) -> Result<()> {
    let pool = PgPool::connect(connection_string).await?;
    sqlx::query("SELECT 1").execute(&pool).await?;
    Ok(())
}

/// Execute a query and return the results as a vector of type T
pub async fn execute_query<T>(query: &str) -> Result<Vec<T>>
where
    T: for<'r> FromRow<'r, sqlx::postgres::PgRow> + Send + Unpin,
{
    let pool = get_pool().ok_or_else(|| anyhow::anyhow!("Database not initialized"))?;

    let rows = sqlx::query_as::<_, T>(query)
        .fetch_all(pool)
        .await?;

    Ok(rows)
}

/// Get a list of all tables in the public schema
pub async fn get_tables() -> Result<Vec<String>> {
    let pool = get_pool().ok_or_else(|| anyhow::anyhow!("Database not initialized"))?;

    #[derive(FromRow)]
    struct TableName {
        table_name: String,
    }

    let tables = sqlx::query_as::<_, TableName>(
        r#"
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        "#
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|row| row.table_name)
    .collect();

    Ok(tables)
}