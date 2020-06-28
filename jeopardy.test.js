describe('getting correct data back from the api', function (){
	it('should return the correct number of category ids', async function (){
		const catIds = await game.getCategoryIds();
		console.log('test categorie ids:' + catIds);
		expect(catIds.length).toEqual(6);
	});

	it('should return random category ids each time', async function (){
		const catIds1 = await game.getCategoryIds();
		const catIds2 = await game.getCategoryIds();
		for (let i = 0; i < 3; i++) {
			expect(catIds1[i]).not.toBe(catIds2[i]);
		}
	});

	it('should return info about a certain category when id is provided', async function (){
		const catIds = await game.getCategoryIds();
		const categoryInfo = await game.getCategory(catIds[0]);

		expect(typeof categoryInfo.title).toEqual('string');
		expect(categoryInfo.clues instanceof Array).toBe(true);
		expect(categoryInfo.clues.length).toBeGreaterThan(0);
	});
});
