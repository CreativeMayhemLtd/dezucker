# dezucker

Simple Bun + TypeScript reader and tooling for JSON data exported from Facebook. 

Currently only supports post data from `{export folder}/your_facebook_activity/posts/your_posts__check_ins__photos_and_videos.json` with formats as of December 31, 2025.

Copy this file to `data/your_posts.json` before running.

Since Facebook tends to update the models without removing old model structures, this shouldn't be a problem and should be mostly future-proof. 

## Running the local service

Run with Bun:

```bash
bun install
bun index.ts
```

Then open http://localhost:3000 in your browser.

The server exposes:
- `/` - static UI to browse the posts
- `/posts?page=1&pageSize=20` - paginated JSON of formatted post objects

## Contributing

Pull requests always welcome, but not all will be accepted.

For issues, for now please only open issues for new structures introduced after December 31, 2025. Right now this really isn't possible, since no sample data is in the repository as of this writing, but the long-term plan is to do so. If you have an example dataset up to date as of 2026, and are legally allowed to share it, please open an issue and we can discuss. We'd still want to ensure anonymization of the data, but it would help immensely with getting development into multiple hands instead of just ours.

### Design decisions

The project prioritizes modularity and strong typing, ensuring it can eventually be consumed as a library or package.

- **Runtime**: Currently uses Bun.
- **Rendering**: Zero-dependency, domain-bound system using TSX. Data objects handle their own representations.
- **Architecture**: Separation of concerns between raw data, business logic, and component-based views.

If you have ideas, we're open to them. We have experience in a ton of languages of varying complexity and age among us, and we can contribute at the same level in nearly all of them.

### Licensing 

Right now? Public domain. As others contribute / things get more complicated? That might change, but it will be open, and we don't want anyone making money off this -- even us. If there IS a money-making organization, it will be a non-profit (in every country there is such a thing), and it will contribute said money to causes that seek the decoupling of human society from social media, and putting it back to something shared, not something parasitic or farmed for someone else's profit.

## TODO
- [X] handle images
- [ ] handle linking tags to other data (at:// urls, etc)
- [X] handle repost plugin interface
- [ ] bsky repost plugin
- [ ] long post services repost plugins