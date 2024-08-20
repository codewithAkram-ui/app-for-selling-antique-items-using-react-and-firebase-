
import { useNavigation } from '@react-navigation/native';

const useNavigationHandler = () => {
  const navigation = useNavigation();

  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  return { navigateTo };
};

export default useNavigationHandler;
