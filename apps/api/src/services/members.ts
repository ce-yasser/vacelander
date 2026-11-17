import {
  pickMemberColor,
  type CreateMemberInput,
  type Member,
  type UpdateMemberInput,
} from "@vaclendar/shared";
import { conflict, notFound } from "@/lib/errors";
import type { Repo } from "@/lib/repo";

const duplicateName = (name: string) => conflict(`A team member named "${name}" already exists`);

export function listMembers(repo: Repo): Promise<Member[]> {
  return repo.listMembers();
}

export function createMember(repo: Repo, input: CreateMemberInput): Promise<Member> {
  return repo.transaction(async (tx) => {
    if (await tx.findMemberByName(input.name)) throw duplicateName(input.name);
    const color =
      input.color ?? pickMemberColor((await tx.listMembers()).map((member) => member.color));
    return tx.createMember({ name: input.name, color });
  });
}

export function updateMember(repo: Repo, id: string, input: UpdateMemberInput): Promise<Member> {
  return repo.transaction(async (tx) => {
    if (!(await tx.getMember(id))) throw notFound("Team member not found");
    if (input.name !== undefined) {
      const sameName = await tx.findMemberByName(input.name);
      if (sameName && sameName.id !== id) throw duplicateName(input.name);
    }
    return tx.updateMember(id, input);
  });
}

export async function deleteMember(repo: Repo, id: string): Promise<void> {
  await repo.transaction(async (tx) => {
    if (!(await tx.getMember(id))) throw notFound("Team member not found");
    await tx.deleteMember(id);
  });
}
