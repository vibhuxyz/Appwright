-- CreateTable
CREATE TABLE "agent_questions" (
    "id" UUID NOT NULL,
    "session_id" VARCHAR(30) NOT NULL,
    "tool_call_id" TEXT,
    "questions" JSONB NOT NULL,
    "answers" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "resolved_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_agent_questions__session_id_status" ON "agent_questions"("session_id", "status");

-- AddForeignKey
ALTER TABLE "agent_questions" ADD CONSTRAINT "agent_questions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "agent_questions" ADD CONSTRAINT "chk_agent_questions__status"
    CHECK ("status" IN ('PENDING', 'ANSWERED', 'DISMISSED', 'EXPIRED'));
