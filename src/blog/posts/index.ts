import type { Article } from "../types";
import { post as controlled } from "./controlled-vs-uncontrolled-components";
import { post as customHooks } from "./custom-hooks-interview-questions";
import { post as context } from "./react-context-api-interview";
import { post as questions } from "./react-interview-questions";
import { post as keys } from "./react-list-keys";
import { post as memo } from "./react-memo-usememo-usecallback";
import { post as fetching } from "./react-data-fetching-interview";
import { post as prep } from "./react-coding-interview-prep";
import { post as aiEra } from "./react-interview-ai-era";
import { post as top5 } from "./top-5-react-interview";
import { post as tenConcepts } from "./10-react-concepts";
import { post as effects } from "./useeffect-interview-questions";
import { post as state } from "./usestate-vs-usereducer-vs-useref";
import { post as cleanup } from "./react-useeffect-cleanup-function";

export const articles: Article[] = [
  cleanup,
  top5,
  aiEra,
  questions,
  tenConcepts,
  effects,
  state,
  keys,
  customHooks,
  memo,
  controlled,
  context,
  fetching,
  prep,
];
