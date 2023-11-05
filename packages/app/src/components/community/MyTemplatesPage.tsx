import { useState, type FC } from 'react';
import { MyTemplatesList } from './MyTemplatesList';
import { CreateNewTemplatePage } from './CreateNewTemplatePage';
import { EditTemplatePage } from './EditTemplatePage';
import { type TemplateResponse } from '../../utils/communityApi';

export const MyTemplatesPage: FC = () => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateResponse | null>(null);

  if (isCreatingNew) {
    return <CreateNewTemplatePage onClose={() => setIsCreatingNew(false)} />;
  }

  if (editingTemplate) {
    return <EditTemplatePage template={editingTemplate} onClose={() => setEditingTemplate(null)} />;
  }

  return (
    <MyTemplatesList
      onCreateNew={() => setIsCreatingNew(true)}
      onEditTemplate={(template) => setEditingTemplate(template)}
    />
  );
};
