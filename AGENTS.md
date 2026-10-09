# Repository instructions

Read and follow [agent.md](agent.md) before editing, uploading media, or publishing.

For questions about libraries, frameworks, SDKs, APIs, CLI tools, or cloud services, fetch current documentation with the Context7 CLI, even if familiar. First run `npx ctx7@latest library <official-name> "<full question>"`, select the most relevant reputable library ID, then run `npx ctx7@latest docs <libraryId> "<question>"`. Use separate queries for distinct concepts and no more than three commands per question. Run outside the default sandbox. Never include credentials in queries. On quota errors, report the error and suggest `npx ctx7@latest login` or `CONTEXT7_API_KEY`; do not silently substitute remembered documentation. This does not apply to general programming, business logic debugging, refactoring, scripts from scratch, or code review.
