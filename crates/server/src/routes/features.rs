use axum::{
    Extension, Json, Router,
    extract::{Query, State},
    middleware::from_fn_with_state,
    response::Json as ResponseJson,
    routing::{get, put},
};
use db::models::feature::{CreateFeature, Feature, UpdateFeature};
use deployment::Deployment;
use serde::Deserialize;
use ts_rs::TS;
use uuid::Uuid;
use utils::response::ApiResponse;

use crate::{DeploymentImpl, error::ApiError, middleware::load_feature_middleware};

#[derive(Deserialize, TS)]
pub struct FeatureSearchParams {
    pub project_id: Uuid,
}

pub async fn get_features(
    State(deployment): State<DeploymentImpl>,
    Query(params): Query<FeatureSearchParams>,
) -> Result<ResponseJson<ApiResponse<Vec<Feature>>>, ApiError> {
    let features = Feature::find_all_by_project(&deployment.db().pool, params.project_id).await?;
    Ok(ResponseJson(ApiResponse::success(features)))
}

pub async fn create_feature(
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<CreateFeature>,
) -> Result<ResponseJson<ApiResponse<Feature>>, ApiError> {
    let feature = Feature::create(&deployment.db().pool, &payload).await?;

    deployment
        .track_if_analytics_allowed(
            "feature_created",
            serde_json::json!({
                "feature_id": feature.id.to_string(),
                "project_id": feature.project_id.to_string(),
                "feature_name": feature.name,
            }),
        )
        .await;

    Ok(ResponseJson(ApiResponse::success(feature)))
}

pub async fn update_feature(
    Extension(feature): Extension<Feature>,
    State(deployment): State<DeploymentImpl>,
    Json(payload): Json<UpdateFeature>,
) -> Result<ResponseJson<ApiResponse<Feature>>, ApiError> {
    let updated_feature = Feature::update(&deployment.db().pool, feature.id, &payload).await?;

    deployment
        .track_if_analytics_allowed(
            "feature_updated",
            serde_json::json!({
                "feature_id": feature.id.to_string(),
                "feature_name": updated_feature.name,
            }),
        )
        .await;

    Ok(ResponseJson(ApiResponse::success(updated_feature)))
}

pub async fn delete_feature(
    Extension(feature): Extension<Feature>,
    State(deployment): State<DeploymentImpl>,
) -> Result<ResponseJson<ApiResponse<()>>, ApiError> {
    let rows_affected = Feature::delete(&deployment.db().pool, feature.id).await?;
    if rows_affected == 0 {
        Err(ApiError::Database(sqlx::Error::RowNotFound))
    } else {
        Ok(ResponseJson(ApiResponse::success(())))
    }
}

pub fn router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    let feature_router = Router::new()
        .route("/", put(update_feature).delete(delete_feature))
        .layer(from_fn_with_state(deployment.clone(), load_feature_middleware));

    let inner = Router::new()
        .route("/", get(get_features).post(create_feature))
        .nest("/{feature_id}", feature_router);

    Router::new().nest("/features", inner)
}
