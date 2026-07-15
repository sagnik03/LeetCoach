CREATE TABLE "code_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_problem_id" uuid NOT NULL,
	"code" text NOT NULL,
	"language" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_problem_id" uuid NOT NULL,
	"chunk_type" varchar(50) NOT NULL,
	"content_chunk" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mistakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_problem_id" uuid NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"prevention_plan" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leetcode_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"title_slug" varchar(255) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"url" varchar(512) NOT NULL,
	"topic_tags" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "problems_leetcode_id_unique" UNIQUE("leetcode_id"),
	CONSTRAINT "problems_title_slug_unique" UNIQUE("title_slug")
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_problem_id" uuid NOT NULL,
	"rated_at" timestamp DEFAULT now() NOT NULL,
	"rating" varchar(20) NOT NULL,
	"ease_factor" double precision NOT NULL,
	"interval_days" integer NOT NULL,
	"review_duration_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "user_problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"mastery_level" integer DEFAULT 0 NOT NULL,
	"ease_factor" double precision DEFAULT 2.5 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"last_reviewed" timestamp,
	"next_review" timestamp DEFAULT now() NOT NULL,
	"last_rating" varchar(20),
	"notes" text DEFAULT '',
	"ai_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_problems_user_id_problem_id_unique" UNIQUE("user_id","problem_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_user_problem_id_user_problems_id_fk" FOREIGN KEY ("user_problem_id") REFERENCES "public"."user_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_user_problem_id_user_problems_id_fk" FOREIGN KEY ("user_problem_id") REFERENCES "public"."user_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mistakes" ADD CONSTRAINT "mistakes_user_problem_id_user_problems_id_fk" FOREIGN KEY ("user_problem_id") REFERENCES "public"."user_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_user_problem_id_user_problems_id_fk" FOREIGN KEY ("user_problem_id") REFERENCES "public"."user_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problems" ADD CONSTRAINT "user_problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problems" ADD CONSTRAINT "user_problems_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embedding_hnsw_idx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "next_review_idx" ON "user_problems" USING btree ("next_review");