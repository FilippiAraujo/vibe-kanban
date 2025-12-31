use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct Feature {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, TS)]
pub struct CreateFeature {
    pub project_id: Uuid,
    pub name: String,
}

#[derive(Debug, Deserialize, TS)]
pub struct UpdateFeature {
    pub name: Option<String>,
}

impl Feature {
    pub async fn find_all_by_project(
        pool: &SqlitePool,
        project_id: Uuid,
    ) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            Feature,
            r#"SELECT id as "id!: Uuid", project_id as "project_id!: Uuid", name, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>"
               FROM features
               WHERE project_id = $1
               ORDER BY name ASC"#,
            project_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            Feature,
            r#"SELECT id as "id!: Uuid", project_id as "project_id!: Uuid", name, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>"
               FROM features
               WHERE id = $1"#,
            id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn create(pool: &SqlitePool, data: &CreateFeature) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        sqlx::query_as!(
            Feature,
            r#"INSERT INTO features (id, project_id, name)
               VALUES ($1, $2, $3)
               RETURNING id as "id!: Uuid", project_id as "project_id!: Uuid", name, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>""#,
            id,
            data.project_id,
            data.name
        )
        .fetch_one(pool)
        .await
    }

    pub async fn update(
        pool: &SqlitePool,
        id: Uuid,
        data: &UpdateFeature,
    ) -> Result<Self, sqlx::Error> {
        let existing = Self::find_by_id(pool, id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?;

        let name = data.name.as_ref().unwrap_or(&existing.name);

        sqlx::query_as!(
            Feature,
            r#"UPDATE features
               SET name = $2, updated_at = datetime('now', 'subsec')
               WHERE id = $1
               RETURNING id as "id!: Uuid", project_id as "project_id!: Uuid", name, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>""#,
            id,
            name
        )
        .fetch_one(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<u64, sqlx::Error> {
        let result: sqlx::sqlite::SqliteQueryResult =
            sqlx::query!("DELETE FROM features WHERE id = $1", id)
                .execute(pool)
                .await?;
        Ok(result.rows_affected())
    }
}
