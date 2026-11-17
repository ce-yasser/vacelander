"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateMemberInput,
  CreateVacationInput,
  UpdateMemberInput,
  UpdateVacationInput,
} from "@vaclendar/shared";
import { api, type VacationParams } from "./api";

export const queryKeys = {
  members: ["members"] as const,
  vacations: ["vacations"] as const,
  vacationList: (params: VacationParams) => ["vacations", params] as const,
};

export function useMembers() {
  return useQuery({ queryKey: queryKeys.members, queryFn: api.listMembers });
}

export function useVacations(params: VacationParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vacationList(params),
    queryFn: () => api.listVacations(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Any vacation change refreshes every cached vacation list. */
function useInvalidate() {
  const client = useQueryClient();
  return {
    vacations: () => client.invalidateQueries({ queryKey: queryKeys.vacations }),
    // Member names and colors are embedded in vacations, so refresh both.
    members: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.members }),
        client.invalidateQueries({ queryKey: queryKeys.vacations }),
      ]),
  };
}

export function useCreateVacation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateVacationInput) => api.createVacation(input),
    onSuccess: invalidate.vacations,
  });
}

export function useUpdateVacation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVacationInput }) =>
      api.updateVacation(id, input),
    onSuccess: invalidate.vacations,
  });
}

export function useDeleteVacation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.deleteVacation(id),
    onSuccess: invalidate.vacations,
  });
}

export function useCreateMember() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateMemberInput) => api.createMember(input),
    onSuccess: invalidate.members,
  });
}

export function useUpdateMember() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMemberInput }) =>
      api.updateMember(id, input),
    onSuccess: invalidate.members,
  });
}

export function useDeleteMember() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.deleteMember(id),
    onSuccess: invalidate.members,
  });
}
