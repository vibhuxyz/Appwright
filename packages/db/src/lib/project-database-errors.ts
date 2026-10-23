export type ProjectDatabaseErrorCode =
  | "PROJECT_NOT_FOUND"
  | "NOT_DATABASE_BACKED"
  | "QUOTA_EXCEEDED"
  | "MONGO_UNAVAILABLE"
  | "SCOPED_USERS_REQUIRED"
  | "PROVISION_FAILED"
  | "NOT_READY"
  | "CONFLICT";

export class ProjectDatabaseError extends Error {
  readonly code: ProjectDatabaseErrorCode;
  readonly httpStatus: number;

  constructor(
    code: ProjectDatabaseErrorCode,
    message: string,
    httpStatus: number,
  ) {
    super(message);
    this.name = "ProjectDatabaseError";
    this.code = code;
    this.httpStatus = httpStatus;
  }

  static notFound(): ProjectDatabaseError {
    return new ProjectDatabaseError(
      "PROJECT_NOT_FOUND",
      "not found",
      404,
    );
  }

  static notDatabaseBacked(): ProjectDatabaseError {
    return new ProjectDatabaseError(
      "NOT_DATABASE_BACKED",
      "This project does not use a generated-app database",
      422,
    );
  }

  static quotaExceeded(max: number): ProjectDatabaseError {
    return new ProjectDatabaseError(
      "QUOTA_EXCEEDED",
      `Project database quota reached (${max}). Delete unused projects or upgrade.`,
      422,
    );
  }

  static mongoUnavailable(detail: string): ProjectDatabaseError {
    return new ProjectDatabaseError(
      "MONGO_UNAVAILABLE",
      `Could not reach the project database cluster. ${detail}`,
      503,
    );
  }

  static scopedUsersRequired(): ProjectDatabaseError {
    return new ProjectDatabaseError(
      "SCOPED_USERS_REQUIRED",
      "This cluster cannot create database-scoped users. Set MONGODB_REQUIRE_SCOPED_USERS=false to allow the documented shared-credential fallback, or use a MongoDB deployment that supports createUser.",
      503,
    );
  }

  static failed(detail: string): ProjectDatabaseError {
    return new ProjectDatabaseError("PROVISION_FAILED", detail, 500);
  }

  static notReady(): ProjectDatabaseError {
    return new ProjectDatabaseError(
      "NOT_READY",
      "Project database is not ready",
      409,
    );
  }
}
