import type { PureMenuProps } from '@affine/component';
import { Input, PureMenu, TreeView } from '@affine/component';
import { useTranslation } from '@affine/i18n';
import { RemoveIcon, SearchIcon } from '@blocksuite/icons';
import type { PageMeta } from '@blocksuite/store';
import React, { useCallback, useState } from 'react';

import { usePinboardData } from '../../../../hooks/affine/use-pinboard-data';
import { usePinboardHandler } from '../../../../hooks/affine/use-pinboard-handler';
import { usePageMetaHelper } from '../../../../hooks/use-page-meta';
import type { BlockSuiteWorkspace } from '../../../../shared';
import { toast } from '../../../../utils';
import { PinboardRender } from '../pinboard-render/';
import {
  StyledMenuContent,
  StyledMenuFooter,
  StyledMenuSubTitle,
  StyledPinboard,
  StyledSearchContainer,
} from '../styles';
import { SearchContent } from './SearchContent';

export type PinboardMenuProps = {
  metas: PageMeta[];
  currentMeta: PageMeta;
  blockSuiteWorkspace: BlockSuiteWorkspace;
  showRemovePinboard?: boolean;
  onPinboardClick?: (p: { dragId: string; dropId: string }) => void;
} & PureMenuProps;

export const PinboardMenu = ({
  metas,
  currentMeta,
  blockSuiteWorkspace,
  showRemovePinboard = false,
  onPinboardClick,
  ...pureMenuProps
}: PinboardMenuProps) => {
  const { t } = useTranslation();
  const { setPageMeta } = usePageMetaHelper(blockSuiteWorkspace);
  const [query, setQuery] = useState('');
  const isSearching = query.length > 0;

  const searchResult = metas.filter(
    meta => !meta.trash && meta.title.includes(query)
  );

  const { handleDrop } = usePinboardHandler({
    blockSuiteWorkspace,
    metas,
  });

  const handleClick = useCallback(
    (dropId: string) => {
      const targetTitle = metas.find(m => m.id === dropId)?.title;

      handleDrop(currentMeta.id, dropId, {
        bottomLine: false,
        topLine: false,
        internal: true,
      });
      onPinboardClick?.({ dragId: currentMeta.id, dropId });
      toast(`Moved "${currentMeta.title}" to "${targetTitle}"`);
    },
    [currentMeta.id, currentMeta.title, handleDrop, metas, onPinboardClick]
  );

  const { data } = usePinboardData({
    metas,
    pinboardRender: PinboardRender,
    blockSuiteWorkspace,
    onClick: (e, node) => {
      handleClick(node.id);
    },
  });

  return (
    <PureMenu
      width={320}
      height={480}
      {...pureMenuProps}
      data-testid="pinboard-menu"
    >
      <StyledSearchContainer>
        <label>
          <SearchIcon />
        </label>
        <Input
          value={query}
          onChange={setQuery}
          placeholder={t('Move page to...')}
          height={32}
          noBorder={true}
          onClick={e => e.stopPropagation()}
          data-testid="pinboard-menu-search"
        />
      </StyledSearchContainer>

      <StyledMenuContent>
        {isSearching && (
          <SearchContent results={searchResult} onClick={handleClick} />
        )}
        {!isSearching && (
          <>
            <StyledMenuSubTitle>Suggested</StyledMenuSubTitle>
            <TreeView data={data} indent={16} enableDnd={false} />
          </>
        )}
      </StyledMenuContent>

      {showRemovePinboard && (
        <StyledMenuFooter>
          <StyledPinboard
            data-testid={'remove-from-pinboard-button'}
            onClick={() => {
              const parentMeta = metas.find(m =>
                m.subpageIds.includes(currentMeta.id)
              );
              if (!parentMeta) return;
              const newSubpageIds = [...parentMeta.subpageIds];
              const deleteIndex = newSubpageIds.findIndex(
                id => id === currentMeta.id
              );
              newSubpageIds.splice(deleteIndex, 1);
              setPageMeta(parentMeta.id, { subpageIds: newSubpageIds });
            }}
          >
            <RemoveIcon />
            {t('Remove from Pinboard')}
          </StyledPinboard>
          <p>{t('RFP')}</p>
        </StyledMenuFooter>
      )}
    </PureMenu>
  );
};

export default PinboardMenu;
