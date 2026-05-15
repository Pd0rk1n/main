



















var ContextStore = (() => {
  'use strict';

  class ContextStore {

    constructor(contextStoreData) {
      this.enabled = Boolean(contextStoreData && contextStoreData.enabled);
      this.policies = ({});
      if (contextStoreData && contextStoreData.policies) {
        for (const [cookieStoreId, policy] of Object.entries(contextStoreData.policies)) {
          this.policies[cookieStoreId] = new Policy(policy);
        }
      }
    }

    static hydrate(dry, contextObj) {
      let newPolicies = new Object();
      for (const [cookieStoreId, policy] of Object.entries(dry.policies)) {
        newPolicies[cookieStoreId] = new Policy(contextObj.policies[cookieStoreId]);
      }
      var newContextStore = ({
        enabled: dry.enabled,
        policies: newPolicies,
      });
      newContextStore = contextObj ? Object.assign(contextObj, newContextStore)
        : new ContextStore(newContextStore);
      return newContextStore;
    }

    dry(includeTemp = false) {
      var policies = Object.assign({}, this.policies);
      for (const [cookieStoreId, policy] of Object.entries(policies)) {
        policies[cookieStoreId] = policy.dry(includeTemp);
      }
      return ({
        enabled: this.enabled,
        policies,
      });
    }

    revokeTemp() {
      ContextStore.hydrate(this.dry(), this);
      return this;
    }

    setAll(params = {}) {
      for (const [key, value] of Object.entries(params)) {
        for (const [cookieStoreId, policy] of Object.entries(this.policies)) {
          policy[key] = value;
        }
      }
    }

    get snapshot() {
      return JSON.stringify(this.dry(true));
    }

    equals(other) {
      this.snapshot === other.snapshot;
    }

    updatePresets(policy) {
      Object.entries(this.policies).forEach(([cookieStoreId, containerPolicy]) => {
        containerPolicy.DEFAULT.capabilities = new Set(policy.DEFAULT.capabilities);
        containerPolicy.TRUSTED.capabilities = new Set(policy.TRUSTED.capabilities);
        containerPolicy.UNTRUSTED.capabilities = new Set(policy.UNTRUSTED.capabilities);
      });
    }

    async updateContainers(defaultPolicy = null) {
      if (!(this.enabled && browser.contextualIdentities)) {
        return;
      }
      let identities;
      try {
        identities = await browser.contextualIdentities.query({});
      } catch (e) {

        this.enabled = false;
        this.disabledByHost = true;
      }
      if (!identities) {
        return;
      }
      identities.forEach(({cookieStoreId}) => {
        if (!this.policies.hasOwnProperty(cookieStoreId)) {
          if (!defaultPolicy) {
            defaultPolicy = new Policy().dry();
          } else if (typeof defaultPolicy.dry == 'function') {
            defaultPolicy = defaultPolicy.dry();
          }
          this.policies[cookieStoreId] = new Policy(defaultPolicy);
        }
      })
    }
  }

  return ContextStore;
})();
