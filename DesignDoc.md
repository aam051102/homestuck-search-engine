## Home
### Structure
{
	uniqueId: {
		content: tag,
		appearances: resultIndices.length,
		resultIndices: {
			resultId: uniqueId/index
		}
	}
}

### Render
Sort tags. Loop through all tags and render inputs with unique IDs.

### Edit
Get the index of the tag in all of the results.
Replace the tag with the edited tag.

### Insert
Get index of current tag. Get the index of the current tag in all of the results. If it doesn't exist, pick lowest point.
Add new tag to all results in chosen indices. Add new blank line to editing section.

### Remove
Get index of current tag. Get the index of the current tag in all of the results.
Remove line from results. Remove line from editing section.
