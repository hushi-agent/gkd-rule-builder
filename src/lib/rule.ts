import JSON5 from 'json5';

export interface RuleAppInput {
  appId: string;
  appName: string;
  groupName: string;
  groupKey?: number;
  activityId?: string;
  selectors: Array<{ nodeId: number; matches: string }>;
  includeActivity?: boolean;
  /** 开屏广告自动屏蔽：使用快速查询/匹配窗口/每次启动限一次等配置 */
  splash?: boolean;
}

export interface GkdRule {
  key: number;
  name?: string;
  matches: string;
  action: string;
  activityIds?: string;
  fastQuery?: boolean;
}

export interface GkdGroup {
  key: number;
  name: string;
  rules: GkdRule[];
  matchTime?: number;
  actionMaximum?: number;
  resetMatch?: string;
}

export interface GkdApp {
  id: string;
  name: string;
  groups: GkdGroup[];
}

/** 生成可直接粘贴到 GKD 本地应用规则的应用级对象 */
export const composeRuleApp = (input: RuleAppInput): GkdApp => {
  const splash = input.splash !== false;
  const rules: GkdRule[] = input.selectors.map((item, index) => {
    const rule: GkdRule = {
      key: index,
      matches: item.matches,
      action: 'clickCenter',
    };
    if (splash) rule.fastQuery = true;
    if (input.includeActivity !== false && input.activityId) {
      rule.activityIds = input.activityId;
    }
    return rule;
  });

  const group: GkdGroup = {
    key: input.groupKey ?? 1,
    name: input.groupName || '规则组',
    rules,
  };
  if (splash) {
    group.matchTime = 10000;
    group.actionMaximum = 1;
    group.resetMatch = 'app';
  }

  return {
    id: input.appId,
    name: input.appName,
    groups: [group],
  };
};

export const toJson5 = (value: unknown): string => JSON5.stringify(value, undefined, 2);
