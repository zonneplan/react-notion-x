import * as React from 'react'

import { useHotkeys } from 'react-hotkeys-hook'
import { getBlockTitle, getBlockIcon, getBlockParentPage } from 'notion-utils'
import { useNotionContext } from '../context'
import { PageIcon } from './page-icon'
import { SearchIcon } from '../icons/search-icon'
import { cs } from '../utils'
import { SearchDialog } from './search-dialog'
import useWindowDimensions from '../hooks/useWindowDimensions'

const getBreadcrumbLimit = (currentWindowWidth: number): number => {
  if (currentWindowWidth < 500) {
    return 2;
  }

  if (currentWindowWidth < 830) {
    return 3;
  }

  return 6;
}

export const PageHeader: React.FC<{}> = () => {
  const {
    components,
    recordMap,
    rootPageId,
    mapPageUrl,
    searchNotion
  } = useNotionContext()

  const { windowWidth } = useWindowDimensions();

  const blockMap = recordMap.block
  const blockIds = Object.keys(blockMap)
  const activePageId = blockIds[0]
  const hasSearch = !!searchNotion

  if (!activePageId) {
    return null
  }

  const breadcrumbs = []
  let currentPageId = activePageId

  do {
    const block = blockMap[currentPageId]?.value
    if (!block) {
      break
    }

    const title = getBlockTitle(block, recordMap)
    const icon = getBlockIcon(block, recordMap)

    if (!(title || icon)) {
      break
    }

    breadcrumbs.push({
      block,
      active: currentPageId === activePageId,
      pageId: currentPageId,
      title,
      icon
    })

    const parentBlock = getBlockParentPage(block, recordMap)
    const parentId = parentBlock?.id

    if (!parentId) {
      break
    }

    currentPageId = parentId
  } while (true)

  const breadcrumbsTotal = breadcrumbs.length
  const breadcrumbsLimit = getBreadcrumbLimit(windowWidth)
  let breadrumbsToRemove = breadcrumbsTotal > breadcrumbsLimit ? Math.abs(breadcrumbsLimit - breadcrumbsTotal) : 0;
  console.log('remove', breadrumbsToRemove);

  let filteredBreadcrumbs = [...breadcrumbs];

  filteredBreadcrumbs
    .shift()

  breadrumbsToRemove -= 1;

  filteredBreadcrumbs = filteredBreadcrumbs
    .reverse()
    .filter((value, index) => {
      console.log(`index ${index}`)
      if (breadrumbsToRemove > 0 && index > 0) {
        breadrumbsToRemove -= 1;
        console.log('hide', value);
        return false;
      }

      return true;
    })


  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const onOpenSearch = React.useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const onCloseSearch = React.useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  useHotkeys('cmd+p', (event) => {
    onOpenSearch()
    event.preventDefault()
    event.stopPropagation()
  })

  return (
    <header className='notion-header'>
      {isSearchOpen && hasSearch && (
        <SearchDialog
          isOpen={isSearchOpen}
          rootBlockId={rootPageId || activePageId}
          onClose={onCloseSearch}
          searchNotion={searchNotion}
        />
      )}

      <div className='nav-header'>
        <div className='breadcrumbs'>
          {filteredBreadcrumbs.map((breadcrumb, index) => {
            const pageLinkProps: any = {}
            const componentMap = {
              pageLink: components.pageLink
            }

            if (breadcrumb.active) {
              componentMap.pageLink = (props) => <div {...props} />
            } else {
              pageLinkProps.href = mapPageUrl(breadcrumb.pageId)
            }

            return (
              <React.Fragment key={breadcrumb.pageId}>
                <componentMap.pageLink
                  className={cs('breadcrumb', breadcrumb.active && 'active')}
                  {...pageLinkProps}
                >
                  {breadcrumb.icon && (
                    <PageIcon className='icon' block={breadcrumb.block} />
                  )}

                  {breadcrumb.title && (
                    <span className='title'>{breadcrumb.title}</span>
                  )}
                </componentMap.pageLink>

                {index < filteredBreadcrumbs.length - 1 && (
                  <span className='spacer'>/</span>
                )}
              </React.Fragment>
            )
          })}
        </div>

        <div className='rhs'>
          {hasSearch && (
            <div
              role='button'
              className={cs('breadcrumb', 'button', 'notion-search-button')}
              onClick={onOpenSearch}
            >
              <SearchIcon className='searchIcon' />

              <span className='title'>Zoeken</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
