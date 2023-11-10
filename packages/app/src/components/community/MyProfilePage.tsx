import Button from '@atlaskit/button';
import { Field } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type FC, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { fetchCommunity } from '../../utils/getCommunityApi';
import { getProfileResponseChecker, type PutProfileBody } from '../../utils/communityApi';
import { css } from '@emotion/react';

const styles = css`
  .actions {
    margin-top: 16px;
    display: flex;
    gap: 16px;
  }
`;

export const MyProfilePage: FC = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => fetchCommunity('/profile', getProfileResponseChecker),
  });

  useEffect(() => {
    if (!data) return;

    setUsername(data.user.username);
    setDisplayName(data.user.displayName);
    setEmail(data.user.email);
  }, [data]);

  const saveProfileChanges = useMutation({
    mutationFn: async () => {
      const response = await fetchCommunity('/profile', getProfileResponseChecker, {
        method: 'PUT',
        body: JSON.stringify({
          username,
          displayName,
          email,
        } satisfies PutProfileBody),
      });

      return response;
    },
    onMutate: () => {
      toast.info('Profile changes saved.');
    },
  });

  return (
    <div css={styles}>
      <h1>My Profile</h1>
      <form>
        <Field name="username" label="Username">
          {() => (
            <TextField
              name="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
            />
          )}
        </Field>
        <Field name="displayName" label="Display Name">
          {() => (
            <TextField
              name="displayName"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)}
            />
          )}
        </Field>
        <Field name="email" label="Email">
          {() => (
            <TextField
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            />
          )}
        </Field>
        <div className="actions">
          <Button appearance="primary" onClick={() => saveProfileChanges.mutate()}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};
