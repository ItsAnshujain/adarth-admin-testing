import { Button, Image } from '@mantine/core';
import React, { useState } from 'react';
import CheckIcon from '../../../assets/check.svg';
import TrashIcon from '../../../assets/trash.svg';
import { useDeleteContact } from '../../../apis/queries/contacts.queries';

const DeleteContactContent = ({ onClickCancel = () => {}, onConfirm = () => {}, id }) => {
  const [accept, setAccept] = useState(false);
  const { mutateAsync: deleteContact, isLoading } = useDeleteContact();

  const handleConfirm = () => {
    deleteContact(id, {
      onSuccess: () => {
        setAccept(true);
        setTimeout(() => {
          onClickCancel();
          onConfirm();
        }, 2000);
      },
    });
  };

  return (
    <div className="flex flex-col justify-evenly items-center min-h-[230px]">
      <Image src={!accept ? TrashIcon : CheckIcon} height={65} width={65} />
      <p className="font-bold text-2xl">
        {!accept ? 'Are you sure you want to delete?' : 'Deleted successfully'}
      </p>
      {!accept ? (
        <div className="flex gap-2  justify-end">
          <Button
            onClick={onClickCancel}
            className="bg-black text-white rounded-md text-sm px-6 py-3"
            disabled={isLoading}
          >
            No
          </Button>
          <Button
            className="primary-button"
            onClick={handleConfirm}
            loading={isLoading}
            disabled={isLoading}
          >
            Yes
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default DeleteContactContent;
