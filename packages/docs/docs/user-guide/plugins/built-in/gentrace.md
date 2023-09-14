---
sidebar_label: Gentrace
---

# Gentrace Plugin

[Gentrace](https://gentrace.ai) is an evaluation and observability product that helps improve the quality, safety, and compliance of your AI features.

Gentrace complements Rivet by providing Rivet users a seamless way to evaluate their Rivet graphs using Gentrace.

This plugin adds UI to interact with Gentrace directly from the Rivet graph.

### Documentation

Gentrace's documentation is publicly available [here](https://docs.gentrace.ai/docs).

### Getting started

Once the Gentrace plugin is installed in Rivet, you will need to [create a Gentrace API key](https://gentrace.ai/settings/api-keys) if you don't already have one.

Then, supply that API key in the Gentrace plugin tab.

![](https://media.cleanshot.cloud/media/616/jWe6g0ihtGinXAd87w265I1Ptfk6Janz5oBc2Yil.jpeg?response-content-disposition=attachment%3Bfilename%3DCleanShot%25202023-09-14%2520at%252011.13.33.jpeg&Expires=1694726030&Signature=bdZzy23Lo6pWK6RJ4nQg12gEKln5nIafjzIHZr6LUT1O3CalK8irnw4ha16cFAtFOv8oUAOuBubVIjM8rO1OLQOOinX1Y7fKC0BEdMgDNUbjiWKwcNplH0WUlJWgkmH~Sdv3RiMId7O1FJM~cMnFgWMVcOXP8lVLhPQgU1HRWL5YKlW612wH7ncJYEc8C8-pJCb5-Ip-TJeXrnZ7y6iSJ2Zt1WB6xHocPwnYm1kFpPzFqoOO0Q~dQM6nrmVdSnRN4c1XDc8KUXuF26Aw9CtrIggUxjghOTTWNEZqXt8KeXJHJNlDU-uaCAhPjQkdGkzjyFwUerEWDBly~ymXWCHykw__&Key-Pair-Id=K269JMAT9ZF4GZ)

### Usage

The plugin exposes two buttons in the Rivet graph view that show up next to the "Run" button.

![](https://media.cleanshot.cloud/media/616/T4zqaTO23dYB8mvQRhPqX3OOZka7cvsbEI3Hgs6i.jpeg?response-content-disposition=attachment%3Bfilename%3DCleanShot%25202023-09-14%2520at%252011.05.47.jpeg&Expires=1694725669&Signature=IsXrWC5sHIY9wDY7-AoeJog45mK96roEz8VWX~6~UkN2FlYOFS6Us~Mqgh-G~dhP~4Afsxan3Ab1toc19npTLjjRxU9Z2xsipP2U-C4Zv7oebcwK3B575D9LunV04Qv7Mj3iNTJ4TttKvW7PLCAGz5NbJIa90XxB4cgRIoSJjNYdUu1ExHaCkFw5fEdah8onXKNXhEVv5YtVdsje3Xn2dwErtQ7MoEgXajrp6P6S2sF~DLRYRbCBet7~Sb3kt2f19R-QJ2v-QoDX7gGMPlxhIiXZST9TbViGB32vQBJZiD~oI~PQoMJyp45F3Lw53om-1KvP5~74QBkpHFXANahZDg__&Key-Pair-Id=K269JMAT9ZF4GZ)


#### Associating a Gentrace pipeline

The "Change Gentrace Pipeline" button associates a Gentrace pipeline with a Rivet graph. 

![](https://files.readme.io/f99dc50-CleanShot_2023-09-14_at_10.07.582x.png)

A Gentrace pipeline captures the analytics, test cases, evaluators, and evaluation results for a generative workflow. Learn more about [Gentrace pipelines here](https://docs.gentrace.ai/docs/pipelines).

#### Running Gentrace tests

The "Run Gentrace tests" graph pulls and runs [test cases](https://docs.gentrace.ai/docs/test-cases) defined in the associated Gentrace pipeline through the Rivet graph. 

To make this more concrete, let's say you define 100 example test cases for a Gentrace pipeline. Each test case has the following schema.

```typescript
type EmailTestCase = {
  "query": string;
  "sender": string;
  "receiver": string;
};
```

The plugin will pull all test cases and invoke the Rivet graph once per case. During each invocation, each key-value pair from a test case maps onto a Graph Input Rivet node with a matching ID. 

With the TestCase schema above, three Graph Input Rivet nodes are required to properly run the graph.

![](https://files.readme.io/ae63992-CleanShot_2023-09-14_at_10.38.482x.png)

### Viewing test results

Once the Gentrace plugin finishes running all test cases through the Rivet graph, the plugin will show a toast notification with a link to the results.

The linked report shows how well that Rivet graph performs against the evaluation benchmarks provided in Gentrace.

![](https://files.readme.io/ce93806-CleanShot_2023-09-14_at_10.41.532x.png)

### Understanding Gentrace evaluation

To learn more about your Gentrace evaluation results, read through the Gentrace evaluation [core concepts](https://docs.gentrace.ai/docs/evaluate-overview) and [quickstart](https://docs.gentrace.ai/docs/evaluate-quickstart) pages.

### Contact

Reach out to [support@gentrace.ai](mailto:support@gentrace.ai) if you have any questions or feature requests.
