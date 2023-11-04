import { useState, type FC } from 'react';
import { MyTemplatesList } from './MyTemplatesList';
import { CreateNewTemplatePage } from './CreateNewTemplatePage';
import { EditTemplatePage } from './EditTemplatePage';

export const MyTemplatesPage: FC = () => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  if (isCreatingNew) {
    return <CreateNewTemplatePage />;
  }

  if (editingTemplate) {
    return <EditTemplatePage template={editingTemplate} />;
  }

  return <MyTemplatesList onCreateNew={() => setIsCreatingNew(true)} />;
};
