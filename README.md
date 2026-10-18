# ror2-item-cheat-sheet

[![Deploy to GitHub Pages](https://github.com/chryw/ror2-item-cheat-sheet/actions/workflows/deploy.yml/badge.svg)](https://github.com/chryw/ror2-item-cheat-sheet/actions/workflows/deploy.yml)

[Click here for the Risk of Rain 2 Item Cheat Sheet](https://chryw.github.io/ror2-item-cheat-sheet/)

This website is an item cheat sheet for the game Risk of Rain 2 (RoR2). In RoR2, progressing through levels gives the player the ability to gain many items. Each item has a different stat it boosts and a different ability. With 248 catalog entries, it can get difficult to determine if you want to pick up each item. This website gives an easy way to see what items do at a glance. Clicking on an item gives a more in depth view of the item, along with links to the relevant wiki page.

The technology used for this project was Vue and Vuex. 

There are 3 sections on the website. The navbar, the item list, and the sidebar. 

The navbar alters the item list to make it easier for the user to navigate the item list. It has functionality like searching for specific items, sorting the items, and filtering out specific types of items. 

Next is the item list. This is the list of all the items. This view gives the user a quick overview of all of the items at a glance. The colours signify the items rarity. Some items have an effective max, (I.E. if item X has an effective max of 5, it is useless to pick up more than 5 of item X) and this value is displayed in the bottom right of the item card. When an item is clicked on, it opens the sidebar.

The sidebar shows an in depth overview of the item, including the stats it changes, a full description, how to unlock it, as well as the link to the wiki page for the item. 

### Run Project
If this is your first time running this project, enter the following command first to install all of the dependencies. 
```
npm install
```

To run the project (assuming you have already installed dependencies before), run the following command.
```
npm run serve
```
Once if runs, you can go to localhost:8080 to see the website.

### Catalog coverage and sources

The catalog includes Survivors of the Void, Seekers of the Storm, Alloyed Collective,
and Hallowed Concepts. On October 18, 2026, the original
[stefanuros/develop catalog](https://github.com/stefanuros/ror2-item-cheat-sheet/tree/develop)
and this fork both had 210 entries, with no Hallowed Concepts coverage.

The 38 Hallowed Concepts additions were checked against the
[wiki item tables](https://riskofrain2.wiki.gg/wiki/Items) and
[DLC overview](https://riskofrain2.wiki.gg/wiki/Hallowed_Concepts):
3 Boss items, 11 Hallowed items, 14 Hexes, 8 N'tormat Pages, 1 Lunar Equipment,
and 1 Elite Equipment. Descriptions summarize the documented mechanics and stacking;
each entry links to its source page. Item images and the DLC badge are hosted locally
and sourced from the wiki; game artwork belongs to its respective owners.

Hallowed items are primarily obtained by cleansing Hexes at a Hallowed Shrine.
Hexes are harmful until cleansed. N'tormat Pages unlock key-item rituals rather than
occupying the equipment slot; consumed Pages regenerate at the next stage.
All three new tiers can be filtered by rarity.

### Validate and publish

Use Node.js 20 (as in CI), then run:

```sh
npm ci
npm run test:catalog
npm run build
```

The existing [deployment workflow](.github/workflows/deploy.yml) builds pull requests
and publishes pushes to `main` to this fork's GitHub Pages site. It sets Vue's
public path to `/ror2-item-cheat-sheet/` so bundled assets work under the project URL.
