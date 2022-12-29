import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserEvent } from "@testing-library/user-event/dist/types/setup/setup";
import WS from "jest-websocket-mock";
import CountryList from "../Components/CountryList";
import { fake_payment_methods } from "./fakes/payment_methods";
import { fake_residence_list } from "./fakes/residence_list";

describe("Payment Method", () => {
  let server: WS;
  let user: UserEvent;
  let client: WebSocket;

  beforeEach(async () => {
    user = userEvent.setup();
    server = new WS("wss://ws.binaryws.com/websockets/v3?app_id=1089", {
      jsonProtocol: true,
    });
    client = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
    render(<CountryList websocket={{ current: client }} />);
  });

  afterEach(() => {
    WS.clean();
    cleanup();
  });

  it("Should render Country Dropdown", () => {
    const country_dropdown = screen.getByTestId("country-dropdown");
    expect(country_dropdown).toBeInTheDocument();
  });

  it("Should render Get List button", () => {
    const get_list_button = screen.getByRole("button", { name: /get list/i });
    expect(get_list_button).toBeInTheDocument();
  });

  it("Should render Clear button", () => {
    const clear_button = screen.getByRole("button", { name: /clear/i });
    expect(clear_button).toBeInTheDocument();
  });

  it("Should not render payment methods table on first render", () => {
    const table = screen.queryByRole("table");
    expect(table).not.toBeInTheDocument();
  });

  it("Should get residence list on first render from websocket server", async () => {
    await expect(server).toReceiveMessage({ residence_list: 1 });
  });

  it("Should render the options list properly", async () => {
    server.send(fake_residence_list);
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(fake_residence_list.residence_list.length + 1);
  });

  it("Should have placeholder option as selected", async () => {
    server.send(fake_residence_list);
    const country_dropdown = screen.getByTestId("country-dropdown");
    const select_placeholder_option = screen.getByRole("option", {
      name: "Please select a country",
    }) as HTMLOptionElement;
    await userEvent.selectOptions(country_dropdown, select_placeholder_option);
    expect(select_placeholder_option.selected).toBeTruthy();
  });

  it("Should render Clear button as disabled", () => {
    const clear_button = screen.getByRole("button", { name: /clear/i });
    expect(clear_button).toBeDisabled();
  });

  it("Should change the selected option properly", async () => {
    server.send(fake_residence_list);
    const country_dropdown = screen.getByTestId("country-dropdown");
    const select_placeholder_option = screen.getByRole("option", {
      name: "Please select a country",
    }) as HTMLOptionElement;
    const india_option = screen.getByRole("option", {
      name: "India - in",
    }) as HTMLOptionElement;
    await userEvent.selectOptions(country_dropdown, india_option);
    expect(india_option.selected).toBeTruthy();
    expect(select_placeholder_option.selected).toBeFalsy();
  });

  it("Should render Clear button as enabled after country selection", async () => {
    server.send(fake_residence_list);
    const country_dropdown = screen.getByTestId("country-dropdown");
    const select_placeholder_option = screen.getByRole("option", {
      name: "Please select a country",
    }) as HTMLOptionElement;
    const india_option = screen.getByRole("option", {
      name: "India - in",
    }) as HTMLOptionElement;
    const clear_button = screen.getByRole("button", { name: /clear/i });

    await userEvent.selectOptions(country_dropdown, india_option);
    expect(india_option.selected).toBeTruthy();
    expect(select_placeholder_option.selected).toBeFalsy();
    expect(clear_button).toBeEnabled();
  });

  it("Should render the payment methods list on Get List button Click", async () => {
    server.send(fake_residence_list);
    const country_dropdown = screen.getByTestId("country-dropdown");
    const india_option = screen.getByRole("option", {
      name: "India - in",
    }) as HTMLOptionElement;
    const get_list_button = screen.getByRole("button", { name: /get list/i });

    await userEvent.selectOptions(country_dropdown, india_option);
    expect(india_option.selected).toBeTruthy();

    server.send(fake_payment_methods);
    await userEvent.click(get_list_button);
    const table = screen.queryByRole("table");
    expect(table).toBeInTheDocument();
  });

  it("Should clear dropdown on Clear button Click", async () => {
    server.send(fake_residence_list);
    const country_dropdown = screen.getByTestId("country-dropdown");
    const select_placeholder_option = screen.getByRole("option", {
      name: "Please select a country",
    }) as HTMLOptionElement;
    const india_option = screen.getByRole("option", {
      name: "India - in",
    }) as HTMLOptionElement;
    await userEvent.selectOptions(country_dropdown, india_option);
    expect(india_option.selected).toBeTruthy();
    expect(select_placeholder_option.selected).toBeFalsy();

    const clear_button = screen.getByRole("button", { name: /clear/i });
    await userEvent.click(clear_button);
    expect(india_option.selected).toBeFalsy();
    expect(select_placeholder_option.selected).toBeTruthy();
  });
});
