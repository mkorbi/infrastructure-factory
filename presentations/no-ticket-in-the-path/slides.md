---
title: No ticket in the path
subtitle: Why software factories need infrastructure factories, in ten minutes
date: 2026-10-30
author: Max Körbächer
duration: 10 min
order: 2
description: The lightning version. Three numbers, the queue, the definition, the five-line test and the first vending line to build.
theme: dark
---

<!-- .slide: class="title" -->
# No ticket in the path

Why software factories need infrastructure factories, in ten minutes

<p class="meta">Max Körbächer · infrastructure-factory.com · October 2026</p>

Note:
Ten minutes, eight slides. The pitch: code got cheap, environments did not, and the platform that fixes that has a name.

---

<p class="eyebrow">The shift</p>

## Code got cheap. Environments still move through tickets.

<div class="stats">
<div class="stat blue"><b>75%</b>of new code at Google is AI-generated and approved by engineers.<small>Sundar Pichai, Google Cloud Next, April 2026</small></div>
<div class="stat"><b>+441%</b>median time a change spends in review.<small>Faros AI, April 2026</small></div>
<div class="stat"><b>−7%</b>main-branch throughput for the median team.<small>CircleCI, February 2026</small></div>
</div>

<p class="src">Vendor-reported figures. Direction, not precision. Sources 4, 7 and 8 at infrastructure-factory.com/sources</p>

Note:
Code supply up, delivery flat or down. The gap is where the queue forms.

---

<!-- .slide: class="statement" -->
## Agents ship code in minutes. <em>The environment it needs waits for a person to open a gate.</em>

Note:
Two lanes, same arrival rate. One clears at agent speed, one clears a few times a day. The queue in front of the gate is the thesis.

---

<p class="eyebrow">The definition</p>

## An Infrastructure Factory is

> A platform that turns intents from humans or agents into compliant, owned, observable, cost-attributed environments, with no ticket in the path.

Intent in: purpose, owner, data, lifetime. Environment out: already owned, compliant, observable and attributed to a cost center. The decisions that used to live in tickets are made once, at the contract.

---

<p class="eyebrow">The test</p>

## Five lines. Do you have one?

<ol class="steps">
<li><b>Intent in, environment out.</b> The product is a place to run things, not a list of resources.</li>
<li><b>No ticket in the path.</b> Humans decide once, at the contract. Nobody decides per request.</li>
<li><b>Policy before provisioning.</b> Allow or deny, with a reason the requester can act on.</li>
<li><b>Ownership and expiry by default.</b> Cost center, compliance owner and on-call are inherited. Everything has a lifetime.</li>
<li><b>The factory measures itself.</b> Lead time, zero-touch rate, time to owner and orphan rate, published to its customers.</li>
</ol>

---

<p class="eyebrow">The ladder</p>

## Where are you?

<div class="ladder">
<div><b>0</b>Ticket desk</div>
<div><b>1</b>Automated fulfilment</div>
<div><b>2</b>Self-service portal</div>
<div><b>3</b>Contracted API</div>
<div class="now"><b>4</b>Infrastructure factory</div>
</div>

A portal moves the form, not the wait. A contracted API removes the person from the request. The factory removes the person from the path and measures itself.

<p class="src">The full ladder: infrastructure-factory.com/infrastructure-factory/#ladder</p>

---

<p class="eyebrow">Where to start</p>

## Start with the sandboxes

Ephemeral sandboxes for coding agents are the first vending line. The demand exists already: sandboxes on Google Kubernetes Engine grew 16x in under five months after the Agent Sandbox preview.

A sandbox needs an identity, a lifetime and a policy, and nothing a human has to sign. Then preview environments per pull request. Then production.

<p class="src">Source 9 at infrastructure-factory.com/sources</p>

---

<!-- .slide: class="title" -->
# Argue with it

**infrastructure-factory.com** · **github.com/mkorbi/infrastructure-factory**

<p class="meta">Max Körbächer · Working concept, revised October 2026</p>
