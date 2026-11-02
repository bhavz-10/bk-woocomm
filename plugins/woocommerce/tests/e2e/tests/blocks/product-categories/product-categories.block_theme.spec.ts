/**
 * External dependencies
 */
import { BLOCK_THEME_SLUG, expect, test } from '@woocommerce/e2e-utils';

const blockData = {
	name: 'Product Categories List',
	slug: 'woocommerce/product-categories',
};

test.describe( `${ blockData.slug } Block`, () => {
	test( 'can be inserted in Post Editor and it is visible on the frontend', async ( {
		editor,
		admin,
		frontendUtils,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: blockData.slug } );
		const blockLocator = await editor.getBlockByName( blockData.slug );
		await expect( blockLocator.getByRole( 'listitem' ) ).toHaveCount( 6 );
		await editor.publishAndVisitPost();
		const blockLocatorFrontend = await frontendUtils.getBlockByName(
			blockData.slug
		);
		await expect(
			blockLocatorFrontend.getByRole( 'listitem' )
		).toHaveCount( 6 );
	} );

	for ( const isDropdown of [ false, true ] ) {
		test( `can toggle top-level categories in a ${
			isDropdown ? 'dropdown' : 'list'
		} and save the setting`, async ( {
			editor,
			admin,
			page,
			frontendUtils,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: blockData.slug,
				attributes: { isDropdown },
			} );
			const block = await editor.getBlockByName( blockData.slug );
			const children = block
				.locator( isDropdown ? 'option' : 'a' )
				.filter( { hasText: 'Hoodies' } );
			await expect( children ).toHaveCount( 1 );
			await editor.selectBlocks( block );
			await editor.openDocumentSettingsSidebar();
			const topLevelOnly = page.getByRole( 'checkbox', {
				name: 'Show only top level categories',
			} );

			await topLevelOnly.check();
			await expect( children ).toHaveCount( 0 );
			await topLevelOnly.uncheck();
			await expect( children ).toHaveCount( 1 );
			await topLevelOnly.check();
			await expect( children ).toHaveCount( 0 );

			await editor.publishAndVisitPost();
			await page.reload();
			const frontendBlock = await frontendUtils.getBlockByName(
				blockData.slug
			);
			await expect(
				frontendBlock
					.locator( isDropdown ? 'option' : 'a' )
					.filter( { hasText: 'Clothing' } )
			).toHaveCount( 1 );
			await expect(
				frontendBlock
					.locator( isDropdown ? 'option' : 'a' )
					.filter( { hasText: 'Hoodies' } )
			).toHaveCount( 0 );
		} );
	}

	test( 'keeps top-level and current-category children controls mutually exclusive', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.visitSiteEditor( {
			postId: `${ BLOCK_THEME_SLUG }//archive-product`,
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.insertBlock( { name: blockData.slug } );
		const block = await editor.getBlockByName( blockData.slug );
		await editor.selectBlocks( block );
		await editor.openDocumentSettingsSidebar();
		const topLevelOnly = page.getByRole( 'checkbox', {
			name: 'Show only top level categories',
		} );
		const childrenOnly = page.getByRole( 'checkbox', {
			name: 'Only show children of current category',
		} );

		await childrenOnly.check();
		await topLevelOnly.check();
		await expect( childrenOnly ).not.toBeChecked();
		await childrenOnly.check();
		await expect( topLevelOnly ).not.toBeChecked();
	} );
} );
