import { a, type ClientSchema } from "@aws-amplify/data-schema";

export const schema = a.schema({
  Schedule: a
    .model({
      title: a.string().required(),
      description: a.string(),
      candidates: a.string().array().required(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  ParticipantResponse: a
    .model({
      scheduleId: a.string().required(),
      name: a.string().required(),
      normalizedName: a.string().required(),
      comment: a.string(),
      answers: a.json().required(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()])
    .secondaryIndexes((index) => [index("scheduleId").name("byScheduleId")]),
});

export type Schema = ClientSchema<typeof schema>;
