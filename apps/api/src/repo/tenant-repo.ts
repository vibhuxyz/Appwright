import { ApprovalRepository } from "./approval-repo";
import { MessageRepository } from "./message-repo";
import { ProjectRepository } from "./project-repo";
import { SessionRepository } from "./session-repo";

export class TenantRepository {
  public readonly projects: ProjectRepository;
  public readonly sessions: SessionRepository;
  public readonly messages: MessageRepository;
  public readonly approvals: ApprovalRepository;

  constructor(public readonly userId: string) {
    this.projects = new ProjectRepository(userId);
    this.sessions = new SessionRepository(userId);
    this.messages = new MessageRepository(userId);
    this.approvals = new ApprovalRepository(userId);
  }
}
