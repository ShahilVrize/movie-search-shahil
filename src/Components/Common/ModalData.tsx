import React, { useEffect, useRef } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useMutation, gql, useQuery } from "@apollo/client";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { toastoptions } from "../../utils";

// Defined validation schema using Yup
const validationSchema = Yup.object({
  last_name: Yup.string().required("Last name is required"),
  first_name: Yup.string().required("First name is required"),
  age: Yup.number().required("Age is required"),
  phone: Yup.string()
    .matches(/^\d{10}$/, "Invalid phone number")
    .required("Phone number is required"),
  user_name: Yup.string().required("User Name is required"),
  role: Yup.object().shape({
    label: Yup.string().required("Field is required."),
    value: Yup.string().required("Field is required."),
  }),
});
type roleType = {
  label: string;
  value: string;
};
interface UserData {
  id?: string;
  last_name: string;
  first_name: string;
  age: number | string;
  phone: number | string;
  user_name: string;
  role: roleType | null;
}

interface MyDialogProps {
  open: boolean;
  handleClose: () => void;
  id: string;
  refetchUser: any;
}

const ModalData: React.FC<MyDialogProps> = ({
  open,
  handleClose,
  id,
  refetchUser,
}) => {
  const GET_USER_BY_ID = gql`
    query GET_USER_BY_ID($id: uuid!) {
      Users_by_pk(id: $id) {
        last_name
        first_name
        age
        phone
        user_name
      }
    }
  `;
  const GET_ROLE_BY_ID = gql`
    query GET_ROLE_BY_ID($id: uuid!) {
      Role_by_pk(id: $id) {
        role_name
        id
      }
    }
  `;
  const CREATE_OR_UPDATE_USER = gql`
    mutation UpsertUser($id: uuid, $input: Users_insert_input!) {
      insert_Users_one(
        object: $input
        on_conflict: {
          constraint: Users_pkey
          update_columns: [last_name, first_name, age, phone, user_name]
        }
      ) {
        id
        last_name
        first_name
        age
        phone
        user_name
      }
    }
  `;
  const getRolesData = gql`
    {
      Roles {
        role_name
        id
      }
    }
  `;
  const { loading: rolesLoading, data: rolesData } = useQuery(getRolesData);
  const { loading, error, data, refetch } = useQuery(GET_USER_BY_ID, {
    variables: { id },
    skip: !id || !open, // Skip the query when id is not present
  });

  const [createOrUpdateUser, { loading: formLoading }] = useMutation(
    CREATE_OR_UPDATE_USER
  );

  const formik = useFormik<UserData>({
    initialValues: {
      last_name: "",
      first_name: "",
      age: "",
      phone: "",
      user_name: "",
      role: null,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const payload: UserData = {
        id,
        ...values,
      };
      if (!id) {
        delete payload.id;
      }
      try {
        await createOrUpdateUser({
          variables: {
            input: payload,
          },
        });
        const successMessage: string = id
          ? "Updated user successfully"
          : "Created user successfully";
        toast.success(successMessage, toastoptions);
        await refetchUser();
        handleClose();
        resetForm();
      } catch (error: any) {
        toast.error(error.message, toastoptions);
        console.log(error.message);
      }
    },
  });
  const formikRef = useRef(formik);

  useEffect(() => {
    formikRef.current = formik;
  }, [formik]);

  useEffect(() => {
    formikRef.current.resetForm();
    if (id) {
      refetch({ id });
    }
  }, [id, refetch]);

  useEffect(() => {
    const handleFormValues = (): void => {
      formikRef.current.setFieldValue(
        "last_name",
        data?.Users_by_pk?.last_name
      );
      formikRef.current.setFieldValue(
        "first_name",
        data?.Users_by_pk?.first_name
      );
      formikRef.current.setFieldValue("age", data?.Users_by_pk?.age);
      formikRef.current.setFieldValue("phone", data?.Users_by_pk?.phone);
      formikRef.current.setFieldValue(
        "user_name",
        data?.Users_by_pk?.user_name
      );
    };

    if (data && id) {
      handleFormValues();
    }
  }, [id, data]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <Typography variant="h6" color="error">
          An error occurred: {error.message}
        </Typography>
      </Box>
    );
  }

  console.log(rolesData?.Roles);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{id ? "Update User" : "Create User"}</DialogTitle>
      <DialogContent>
        <form onSubmit={formik.handleSubmit}>
          <FormControl fullWidth margin="normal">
            <TextField
              name="user_name"
              label="User Name"
              variant="outlined"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.user_name}
              error={
                formik.touched.user_name && Boolean(formik.errors.user_name)
              }
              helperText={formik.touched.user_name && formik.errors.user_name}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              name="first_name"
              label="First Name"
              type="text"
              variant="outlined"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.first_name}
              error={
                formik.touched.first_name && Boolean(formik.errors.first_name)
              }
              helperText={formik.touched.first_name && formik.errors.first_name}
            />
          </FormControl>

          <FormControl fullWidth margin="normal">
            <TextField
              name="last_name"
              label="Last Name"
              variant="outlined"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.last_name}
              error={
                formik.touched.last_name && Boolean(formik.errors.last_name)
              }
              helperText={formik.touched.last_name && formik.errors.last_name}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Autocomplete
              disablePortal
              loading={rolesLoading}
              id="combo-box-demo"
              options={rolesData?.Roles.map(
                (role: { role_name: string; id: string }) => {
                  return {
                    label: role.role_name,
                    value: role.id,
                  };
                }
              )}
              value={formik.values.role}
              onChange={(event, value) => {
                formik.setFieldValue("role", value || {});
              }}
              renderInput={(params) => <TextField {...params} label="Role" />}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              name="age"
              label="Age"
              variant="outlined"
              type="number"
              onChange={(e) => {
                if (e.target.value.length <= 3) {
                  formik.handleChange(e);
                }
              }}
              onBlur={formik.handleBlur}
              value={formik.values.age}
              error={formik.touched.age && Boolean(formik.errors.age)}
              helperText={formik.touched.age && formik.errors.age}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TextField
              name="phone"
              label="Phone"
              variant="outlined"
              type="number"
              inputProps={{ maxLength: 10 }}
              onChange={(e) => {
                if (String(e.target.value).length <= 10) {
                  formik.handleChange(e);
                }
              }}
              onBlur={formik.handleBlur}
              value={formik.values.phone}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
            />
          </FormControl>

          <DialogActions>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              disabled={formLoading}
            >
              {id ? "Update User" : "Create User"}
            </Button>
            <Button onClick={handleClose} color="primary" variant="outlined">
              Cancel
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalData;
