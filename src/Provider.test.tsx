import React, { useContext, FC } from 'react';
import renderer, { act } from 'react-test-renderer';
import { TippleContext } from './context';
import { createAddResponse, createClearDomains, Provider } from './Provider';

const domains = {
  users: ['key1', 'key2', 'key3'],
  posts: ['key1', 'key2', 'key4'],
  comments: ['key2'],
};

const responses = {
  key1: { data: 'example1' },
  key2: { data: 'example2' },
  key3: { data: 'example3' },
  key4: { data: 'example4' },
};

const setDomains = jest.fn();
const setResponses = jest.fn();

beforeEach(jest.clearAllMocks);

describe('createAddResponse', () => {
  const key = 'key5';
  const domainsArr = ['users', 'posts'];
  const data = { data: 'example5' };

  it('adds key to associated domains', () => {
    const fn = createAddResponse(setDomains, setResponses);
    fn({ key, domains: domainsArr, data });

    expect(setDomains.mock.calls[0][0](domains)).toEqual({
      ...domains,
      users: [...domains.users, key],
      posts: [...domains.posts, key],
    });
  });

  it('adds response to collection of responses', () => {
    const fn = createAddResponse(setDomains, setResponses);
    fn({ key, domains: domainsArr, data });

    expect(setResponses.mock.calls[0][0](responses)).toEqual({
      ...responses,
      [key]: {
        refetch: false,
        data,
      },
    });
  });
});

describe('createClearDomains', () => {
  it('sets responses as undefined for provided domains', () => {
    const fn = createClearDomains(domains, setResponses);
    fn(['comments']);

    expect(setResponses.mock.calls[0][0](responses)).toEqual({
      ...responses,
      key2: {
        refetch: true,
        data: responses.key2.data,
      },
    });
  });
});

let context: TippleContext;

const ChildComponent: FC = () => {
  context = useContext(TippleContext);
  return null;
};

describe('provider', () => {
  const config = {
    baseUrl: 'http://example',
    fetchOptions: { headers: { 'content-type': 'application/json' } },
  };

  beforeEach(() => {
    renderer.create(
      <Provider baseUrl={config.baseUrl} fetchOptions={config.fetchOptions}>
        <ChildComponent />
      </Provider>
    );
  });

  it('provides config', () => {
    expect(context.config).toEqual(config);
  });

  describe('on add response', () => {
    const args = {
      key: '1234',
      data: ['my data'],
      domains: ['domain1', 'domain2'],
    };

    it('context domains are updated', () => {
      act(() => context.addResponse(args));

      expect(context.domains).toEqual({
        [args.domains[0]]: [args.key],
        [args.domains[1]]: [args.key],
      });
    });

    it('context responses are updated', () => {
      act(() => context.addResponse(args));

      expect(context.responses).toEqual({
        [args.key]: { data: args.data, refetch: false },
      });
    });
  });

  describe('on clear domains', () => {
    const args1 = { key: '1234', data: ['data1'], domains: ['domain1'] };
    const args2 = { key: '5678', data: ['data2'], domains: ['domain2'] };
    const args3 = {
      key: '9876',
      data: ['data3'],
      domains: ['domain3', 'domain1'],
    };

    beforeEach(() => {
      act(() => context.addResponse(args1));
      act(() => context.addResponse(args2));
      act(() => context.addResponse(args3));
    });

    it('adds refetch to responses in domain', () => {
      act(() => context.clearDomains(['domain1']));
      expect(context.responses).toEqual({
        [args2.key]: { data: args2.data, refetch: false },
        [args1.key]: { data: args1.data, refetch: true },
        [args3.key]: { data: args3.data, refetch: true },
      });
    });
  });
});
