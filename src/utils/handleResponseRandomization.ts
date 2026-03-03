import { IndividualComponent, ParsedStringOption } from '../parser/types';
import { parseStringOptions, parseStringOptionValue } from './stringOptions';

export function randomizeForm(componentConfig: IndividualComponent) {
  const responses = componentConfig.response ?? [];
  const response = responses.map((r) => r.id);

  if (componentConfig.responseOrder === 'random') {
    const fixedIndices = responses.flatMap((r, i) => (r.excludeFromRandomization ? [i] : []));
    const shuffled = responses
      .filter((r) => !r.excludeFromRandomization)
      .map((r) => r.id)
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    return { response: responses.map((r, i) => (fixedIndices.includes(i) ? r.id : shuffled.shift()!)) };
  }

  return { response };
}

export function randomizeOptions(componentConfig: IndividualComponent) {
  const responses = componentConfig.response ?? [];
  return responses.reduce((acc, response) => {
    if (response.type === 'radio' || response.type === 'checkbox' || response.type === 'buttons') {
      const options = parseStringOptions(response.options ?? []);
      if (response.optionOrder === 'random') {
        const shuffled = [...options]
          .map((value) => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);
        acc[response.id] = shuffled;
      } else {
        acc[response.id] = options;
      }
    }
    return acc;
  }, {} as Record<string, ParsedStringOption[]>);
}

export function randomizeQuestionOrder(componentConfig: IndividualComponent) {
  const responses = componentConfig.response ?? [];
  return responses.reduce((acc, response) => {
    if (response.type === 'matrix-radio' || response.type === 'matrix-checkbox') {
      const questions = (response.questionOptions ?? [])
        .map((question) => parseStringOptionValue(question));
      if (response.questionOrder === 'random') {
        const shuffled = [...questions]
          .map((value) => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);
        acc[response.id] = shuffled;
      } else {
        acc[response.id] = questions;
      }
    }
    return acc;
  }, {} as Record<string, string[]>);
}
