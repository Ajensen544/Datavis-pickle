import { Stack, Switch } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { useStorageEngine } from '../../../storage/storageEngineHooks';
import { REVISIT_MODE } from '../../../storage/engines/types';

export function RevisitModesAccordionItem({ studyId }: { studyId: string }) {
  const { storageEngine } = useStorageEngine();

  const [asyncStatus, setAsyncStatus] = useState(false);
  const [dataCollectionEnabled, setDataCollectionEnabled] = useState(false);
  const [studyNavigatorEnabled, setStudyNavigatorEnabled] = useState(false);
  const [analyticsInterfacePubliclyAccessible, setAnalyticsInterfacePubliclyAccessible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (storageEngine) {
        const modes = await storageEngine.getModes(studyId);
        setDataCollectionEnabled(modes.dataCollectionEnabled);
        setStudyNavigatorEnabled(modes.developmentModeEnabled);
        setAnalyticsInterfacePubliclyAccessible(modes.dataSharingEnabled);
        setAsyncStatus(true);
      }
    };
    fetchData();
  }, [storageEngine, studyId]);

  const handleSwitch = async (key: REVISIT_MODE, value: boolean) => {
    if (storageEngine) {
      await storageEngine.setMode(studyId, key, value);

      if (key === 'dataCollectionEnabled') {
        setDataCollectionEnabled(value);
      } else if (key === 'developmentModeEnabled') {
        setStudyNavigatorEnabled(value);
      } else if (key === 'dataSharingEnabled') {
        setAnalyticsInterfacePubliclyAccessible(value);
      }
    }
  };

  return (
    asyncStatus && (
      <Stack>
        <Switch
          label="Data Collection Enabled"
          checked={dataCollectionEnabled}
          onChange={(event) => handleSwitch('dataCollectionEnabled', event.currentTarget.checked)}
        />
        <Switch
          label="Study Navigator Enabled"
          checked={studyNavigatorEnabled}
          onChange={(event) => handleSwitch('developmentModeEnabled', event.currentTarget.checked)}
        />
        <Switch
          label="Analytics Interface Publicly Accessible"
          checked={analyticsInterfacePubliclyAccessible}
          onChange={(event) => handleSwitch('dataSharingEnabled', event.currentTarget.checked)}
        />
      </Stack>
    )
  );
}
